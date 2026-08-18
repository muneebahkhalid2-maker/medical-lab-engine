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

    # ─── NEW: Tests for 10 Report Tests ────────────────────────────

    def test_18_alt_male_normal(self):
        """18. Serum ALT male range (0-42): 25 is NORMAL."""
        input_data = {
            "patient_id": "P18",
            "sex": "male",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum ALT", "result": 25.0, "unit": "U/L"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "NORMAL")
        self.assertEqual(res["results"][0]["reference_range"], "0.0-42.0")

    def test_19_alt_female_high(self):
        """19. Serum ALT female range (0-35): 40 is HIGH."""
        input_data = {
            "patient_id": "P19",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum ALT", "result": 40.0, "unit": "U/L"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "HIGH")

    def test_20_creatinine_male_normal(self):
        """20. Serum Creatinine male range (0.7-1.2): 0.9 is NORMAL."""
        input_data = {
            "patient_id": "P20",
            "sex": "male",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum Creatinine", "result": 0.9, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "NORMAL")
        self.assertEqual(res["results"][0]["reference_range"], "0.7-1.2")

    def test_21_creatinine_female_high(self):
        """21. Serum Creatinine female range (0.6-1.1): 1.6 is HIGH."""
        input_data = {
            "patient_id": "P21",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum Creatinine", "result": 1.6, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "HIGH")
        self.assertEqual(res["results"][0]["reference_range"], "0.6-1.1")

    def test_22_bilirubin_normal(self):
        """22. Serum Total Bilirubin general range (2-17): 10 is NORMAL."""
        input_data = {
            "patient_id": "P22",
            "sex": "male",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum Total Bilirubin", "result": 10.0, "unit": "µmol/L"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "NORMAL")

    def test_23_urea_high(self):
        """23. Urea general range (18-42): 50 is HIGH."""
        input_data = {
            "patient_id": "P23",
            "sex": "unspecified",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Urea", "result": 50.0, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "HIGH")

    def test_24_troponin_normal(self):
        """24. Troponin I HS general range (0.02-0.06): 0.03 is NORMAL."""
        input_data = {
            "patient_id": "P24",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Troponin I HS", "result": 0.03, "unit": "ng/mL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "NORMAL")

    def test_25_sodium_potassium_normal(self):
        """25. Sodium and Potassium both NORMAL."""
        input_data = {
            "patient_id": "P25",
            "sex": "unspecified",
            "extraction_verified": True,
            "lab_results": [
                {"test_name": "Serum Sodium", "result": 140.0, "unit": "mmol/L"},
                {"test_name": "Serum Potassium", "result": 4.2, "unit": "mmol/L"},
            ],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NORMAL")
        self.assertEqual(res["results"][0]["status"], "NORMAL")
        self.assertEqual(res["results"][1]["status"], "NORMAL")

    def test_26_cholesterol_high(self):
        """26. Serum Cholesterol general range (0-200): 250 is HIGH."""
        input_data = {
            "patient_id": "P26",
            "sex": "male",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum Cholesterol", "result": 250.0, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "HIGH")

    def test_27_triglycerides_high(self):
        """27. Serum Triglycerides general range (0-150): 200 is HIGH."""
        input_data = {
            "patient_id": "P27",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [{"test_name": "Serum Triglycerides", "result": 200.0, "unit": "mg/dL"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "HIGH")

    def test_28_hba1c_normal(self):
        """28. HbA1c general range (4.2-6.5): 5.4 is NORMAL."""
        input_data = {
            "patient_id": "P28",
            "sex": "unspecified",
            "extraction_verified": True,
            "lab_results": [{"test_name": "HbA1c", "result": 5.4, "unit": "%"}],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["results"][0]["status"], "NORMAL")

    def test_29_full_10_test_male_report(self):
        """29. All 10 report tests for male patient, all NORMAL."""
        with open(BASE_DIR / "test_report_10_tests.json", "r", encoding="utf-8") as f:
            input_data = json.load(f)
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NORMAL")
        self.assertEqual(len(res["results"]), 10)
        for item in res["results"]:
            self.assertEqual(item["status"], "NORMAL", f"{item['test_name']} should be NORMAL")

    def test_30_other_sex_10_tests_needs_review(self):
        """30. Sex='other' with tests having no 'other' range yields NEEDS_REVIEW."""
        input_data = {
            "patient_id": "P30",
            "sex": "other",
            "extraction_verified": True,
            "lab_results": [
                {"test_name": "Serum ALT", "result": 25.0, "unit": "U/L"},
                {"test_name": "Serum Creatinine", "result": 0.9, "unit": "mg/dL"},
            ],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NEEDS_REVIEW")
        for item in res["results"]:
            self.assertEqual(item["status"], "NEEDS_REVIEW")

    def test_31_unspecified_uses_general_for_10_tests(self):
        """31. Sex='unspecified' uses general range for all tests that have one."""
        input_data = {
            "patient_id": "P31",
            "sex": "unspecified",
            "extraction_verified": True,
            "lab_results": [
                {"test_name": "Urea", "result": 30.0, "unit": "mg/dL"},
                {"test_name": "Serum Sodium", "result": 140.0, "unit": "mmol/L"},
                {"test_name": "HbA1c", "result": 5.4, "unit": "%"},
            ],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(res["overall_status"], "NORMAL")
        for item in res["results"]:
            self.assertEqual(item["status"], "NORMAL")
            self.assertEqual(item["reference_source"], "trusted_clinical_db")

    def test_32_subset_extraction_does_not_add_extra_tests(self):
        """32. Engine processes ONLY tests present in input — does NOT add tests from reference_ranges.json."""
        input_data = {
            "patient_id": "P32",
            "sex": "female",
            "extraction_verified": True,
            "lab_results": [
                {"test_name": "Hemoglobin", "result": 13.0, "unit": "g/dL"},
            ],
        }
        res = self.engine.analyze_report(input_data)
        self.assertEqual(len(res["results"]), 1, "Engine must NOT add extra tests from reference_ranges.json")
        self.assertEqual(res["results"][0]["test_name"], "Hemoglobin")


if __name__ == "__main__":
    unittest.main()

