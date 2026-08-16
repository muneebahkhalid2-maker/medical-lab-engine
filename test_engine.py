import unittest
import json
from pathlib import Path
from engine import MedicalLabStatusEngine, normalize_sex

BASE_DIR = Path(__file__).parent


class TestMedicalLabStatusEngine(unittest.TestCase):
    def setUp(self):
        self.engine = MedicalLabStatusEngine(
            trusted_db_path=BASE_DIR / "reference_ranges.json",
            lab_config_db_path=BASE_DIR / "lab_config_ranges.json",
            research_fallback_db_path=BASE_DIR / "research_fallback_ranges.json",
        )

    def test_01_normal_status(self):
        """1. NORMAL: Result within range yields NORMAL."""
        input_data = {
            "patient_id": "P01",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Hemoglobin", "result": 13.0, "unit": "g/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NORMAL")
        self.assertEqual(res["results"][0]["status"], "NORMAL")

    def test_02_low_status(self):
        """2. LOW: Result below min yields LOW."""
        input_data = {
            "patient_id": "P02",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Hemoglobin", "result": 9.2, "unit": "g/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "ABNORMAL")
        self.assertEqual(res["results"][0]["status"], "LOW")

    def test_03_high_status(self):
        """3. HIGH: Result above max yields HIGH."""
        input_data = {
            "patient_id": "P03",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Blood Glucose", "result": 150.0, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "ABNORMAL")
        self.assertEqual(res["results"][0]["status"], "HIGH")

    def test_04_incomplete_status(self):
        """4. INCOMPLETE: Null result or missing unit yields INCOMPLETE."""
        input_data = {
            "patient_id": "P04",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "WBC", "result": None, "unit": "10^3/uL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "INCOMPLETE")
        self.assertEqual(res["results"][0]["status"], "INCOMPLETE")

    def test_05_needs_review_status(self):
        """5. NEEDS_REVIEW: Unverified extraction yields NEEDS_REVIEW."""
        input_data = {
            "patient_id": "P05",
            "sex": "female",
            "extraction_verified": False,
            "lab_results": [{"test_name": "Hemoglobin", "result": 13.0, "unit": "g/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NEEDS_REVIEW")
        self.assertEqual(res["results"][0]["status"], "NEEDS_REVIEW")

    def test_06_tier1_printed_range_priority(self):
        """6. Tier 1 printed range priority over DB ranges."""
        input_data = {
            "patient_id": "P06",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [
                {
                    "test_name": "Hemoglobin",
                    "result": 11.2,
                    "unit": "g/dL",
                    "reference_range": "11.5-15.5",
                }
            ],
        }
        res = self.engine.analyze_report(input_data)
        item = res["results"][0]
        self.assertEqual(item["status"], "LOW")
        self.assertEqual(item["reference_source"], "patient_printed_report")
        self.assertEqual(item["reference_range"], "11.5-15.5")

    def test_07_tier2_lab_config(self):
        """7. Tier 2 lab config DB priority."""
        input_data = {
            "patient_id": "P07",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Ferritin", "result": 50.0, "unit": "ug/L"}],
        }
        res = self.engine.analyze_report(input_data)
        item = res["results"][0]
        self.assertEqual(item["status"], "NORMAL")
        self.assertEqual(item["reference_source"], "hospital_lab_config")

    def test_08_tier3_trusted_database(self):
        """8. Tier 3 trusted clinical database lookup."""
        input_data = {
            "patient_id": "P08",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "WBC", "result": 7.0, "unit": "10^3/uL"}],
        }
        res = self.engine.analyze_report(input_data)
        item = res["results"][0]
        self.assertEqual(item["status"], "NORMAL")
        self.assertEqual(item["reference_source"], "trusted_clinical_db")

    def test_09_tier4_research_fallback(self):
        """9. Tier 4 research fallback database lookup."""
        input_data = {
            "patient_id": "P09",
            "sex": "unspecified",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Total IgE", "result": 50.0, "unit": "KU/L"}],
        }
        res = self.engine.analyze_report(input_data)
        item = res["results"][0]
        self.assertEqual(item["status"], "NORMAL")
        self.assertEqual(item["reference_source"], "research_prototype_fallback")

    def test_10_male_reference_selection(self):
        """10. Male sex selects male demographic range (Hemoglobin 13.8 - 17.2)."""
        input_data = {
            "patient_id": "P10",
            "sex": "male",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Hemoglobin", "result": 13.0, "unit": "g/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        item = res["results"][0]
        self.assertEqual(item["status"], "LOW")
        self.assertEqual(item["reference_range"], "13.8-17.2")

    def test_11_female_reference_selection(self):
        """11. Female sex selects female demographic range (Hemoglobin 12.1 - 15.1)."""
        input_data = {
            "patient_id": "P11",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Hemoglobin", "result": 13.0, "unit": "g/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        item = res["results"][0]
        self.assertEqual(item["status"], "NORMAL")
        self.assertEqual(item["reference_range"], "12.1-15.1")

    def test_12_other_behavior(self):
        """12. Sex='other' yields NEEDS_REVIEW when no 'other' range exists in DB."""
        input_data = {
            "patient_id": "P12",
            "sex": "other",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Hemoglobin", "result": 13.0, "unit": "g/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NEEDS_REVIEW")
        self.assertEqual(res["results"][0]["status"], "NEEDS_REVIEW")

    def test_13_unspecified_behavior(self):
        """13. Sex='unspecified' uses general range if available."""
        input_data = {
            "patient_id": "P13",
            "sex": "unspecified",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Blood Glucose", "result": 85.0, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NORMAL")
        self.assertEqual(res["results"][0]["status"], "NORMAL")

    def test_14_unit_mismatch(self):
        """14. Unit mismatch yields NEEDS_REVIEW."""
        input_data = {
            "patient_id": "P14",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Hemoglobin", "result": 130.0, "unit": "g/L"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NEEDS_REVIEW")
        self.assertEqual(res["results"][0]["status"], "NEEDS_REVIEW")

    def test_15_missing_reference_range(self):
        """15. Unknown test name yields NEEDS_REVIEW."""
        input_data = {
            "patient_id": "P15",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "UnknownBiomarkerZ", "result": 10.0, "unit": "mg/L"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NEEDS_REVIEW")
        self.assertEqual(res["results"][0]["status"], "NEEDS_REVIEW")

    def test_16_overall_status_aggregation(self):
        """16. Overall status aggregation hierarchy: INCOMPLETE > NEEDS_REVIEW > ABNORMAL > NORMAL."""
        # ABNORMAL case
        data_abnormal = {
            "patient_id": "P16A",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [
                {"test_name": "Hemoglobin", "result": 9.0, "unit": "g/dL"},
                {"test_name": "WBC", "result": 7.0, "unit": "10^3/uL"},
            ],
        }
        self.assertEqual(self.engine.analyze_report(data_abnormal)["overall_status"], "ABNORMAL")

        # INCOMPLETE overrides ABNORMAL
        data_incomplete = {
            "patient_id": "P16B",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [
                {"test_name": "Hemoglobin", "result": 9.0, "unit": "g/dL"},
                {"test_name": "WBC", "result": None, "unit": "10^3/uL"},
            ],
        }
        self.assertEqual(self.engine.analyze_report(data_incomplete)["overall_status"], "INCOMPLETE")

    def test_17_normalize_sex_isolation(self):
        """Verify normalize_sex function and ensure no inference from patient_name."""
        self.assertEqual(normalize_sex("M"), "male")
        self.assertEqual(normalize_sex("Female"), "female")
        self.assertEqual(normalize_sex("Other"), "other")
        self.assertEqual(normalize_sex("InvalidSex"), "unspecified")
        self.assertEqual(normalize_sex(None), "unspecified")


if __name__ == "__main__":
    unittest.main()
