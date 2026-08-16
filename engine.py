import json
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = Path(__file__).parent
TRUSTED_DB_PATH = BASE_DIR / "reference_ranges.json"
LAB_CONFIG_DB_PATH = BASE_DIR / "lab_config_ranges.json"
RESEARCH_FALLBACK_DB_PATH = BASE_DIR / "research_fallback_ranges.json"
DEFAULT_TEST_DATA_PATH = BASE_DIR / "test_data.json"


def normalize_sex(raw_sex: Any) -> str:
    """
    Normalizes sex safely.
    "M", "male", "Male" -> "male"
    "F", "female", "Female" -> "female"
    "other", "Other" -> "other"
    "unspecified", None, or invalid -> "unspecified"
    Note: Does NOT infer sex from name, ID, or any indirect field.
    """
    if not raw_sex or not isinstance(raw_sex, str):
        return "unspecified"
    
    val = raw_sex.strip().lower()
    if val in ["m", "male"]:
        return "male"
    elif val in ["f", "female"]:
        return "female"
    elif val in ["other"]:
        return "other"
    elif val in ["unspecified"]:
        return "unspecified"
    else:
        return "unspecified"


def normalize_unit(unit_str: Any) -> str:
    """Helper to normalize unit strings for comparison."""
    if not unit_str or not isinstance(unit_str, str):
        return ""
    return unit_str.strip().lower()


class MedicalLabStatusEngine:
    """
    Deterministic Medical Laboratory Test Analysis Engine.
    Implements 4-tier reference range lookup priority, demographic matching (sex/unit),
    validation rules, item-level status evaluation, and overall report aggregation.
    """

    def __init__(
        self,
        trusted_db_path: Path = TRUSTED_DB_PATH,
        lab_config_db_path: Path = LAB_CONFIG_DB_PATH,
        research_fallback_db_path: Path = RESEARCH_FALLBACK_DB_PATH,
    ):
        self.trusted_db = self._load_json(trusted_db_path)
        self.lab_config_db = self._load_json(lab_config_db_path)
        self.research_fallback_db = self._load_json(research_fallback_db_path)

    def _load_json(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            return {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load JSON from {path}: {e}", file=sys.stderr)
            return {}

    def extract_printed_report_range(self, item: Dict[str, Any]) -> Optional[Tuple[float, float]]:
        """
        Tier 1 Priority: Extract reference range printed directly on patient report item.
        Supports:
        - "reference_range": "11.5-15.5" or {"min": 11.5, "max": 15.5}
        - "printed_range": "11.5-15.5" or {"min": 11.5, "max": 15.5}
        - "custom_range": {"min": 11.5, "max": 15.5}
        - "ref_min": 11.5, "ref_max": 15.5
        """
        for key in ["reference_range", "printed_range", "custom_range"]:
            val = item.get(key)
            if isinstance(val, dict) and "min" in val and "max" in val:
                try:
                    return (float(val["min"]), float(val["max"]))
                except (ValueError, TypeError):
                    pass
            elif isinstance(val, str) and "-" in val:
                parts = val.split("-")
                if len(parts) == 2:
                    try:
                        return (float(parts[0].strip()), float(parts[1].strip()))
                    except (ValueError, TypeError):
                        pass

        if "ref_min" in item and "ref_max" in item:
            try:
                return (float(item["ref_min"]), float(item["ref_max"]))
            except (ValueError, TypeError):
                pass

        return None

    def lookup_range_in_db(
        self, db: Dict[str, Any], test_name: str, unit: str, sex: str
    ) -> Tuple[Optional[float], Optional[float], Optional[str]]:
        """
        Looks up demographic-specific range for a test within a single database dictionary.
        Returns (min_val, max_val, failure_reason) tuple.
        """
        if test_name not in db:
            return None, None, f"Test '{test_name}' not in database"

        entry = db[test_name]

        # Unit Matching Check
        db_unit = entry.get("unit", "")
        if normalize_unit(unit) != normalize_unit(db_unit):
            return None, None, f"Unit mismatch: patient unit '{unit}' does not match DB unit '{db_unit}'"

        ranges = entry.get("ranges", {})
        if not isinstance(ranges, dict):
            return None, None, "Invalid ranges schema in database"

        selected_range = None

        if sex == "male":
            selected_range = ranges.get("male") or ranges.get("general")
        elif sex == "female":
            selected_range = ranges.get("female") or ranges.get("general")
        elif sex == "other":
            # ONLY use "other" range if explicitly provided in source. Never copy male/female into other.
            selected_range = ranges.get("other")
        elif sex == "unspecified":
            # Use general/all-population range ONLY if explicitly provided.
            selected_range = ranges.get("general")

        if not selected_range or not isinstance(selected_range, dict):
            return None, None, f"No validated demographic range available for sex='{sex}'"

        if "min" in selected_range and "max" in selected_range:
            try:
                return float(selected_range["min"]), float(selected_range["max"]), None
            except (ValueError, TypeError):
                return None, None, "Invalid numeric min/max in database entry"

        return None, None, "Missing min/max in database entry"

    def lookup_reference_range(
        self, item: Dict[str, Any], sex: str
    ) -> Tuple[Optional[float], Optional[float], Optional[str], Optional[str]]:
        """
        STEP 3: 4-Tier Reference Range Priority Lookup:
        Tier 1: Printed on patient's report
        Tier 2: Hospital/lab configured range
        Tier 3: Trusted reference database
        Tier 4: Research/prototype fallback (Kaggle dataset)

        Returns (min_val, max_val, tier_source, failure_reason).
        """
        test_name = item.get("test_name", "")
        unit = item.get("unit", "")

        # Tier 1: Printed on Patient Report
        printed = self.extract_printed_report_range(item)
        if printed is not None:
            return printed[0], printed[1], "patient_printed_report", None

        # Tier 2: Hospital / Lab Configured Range
        min_v, max_v, err2 = self.lookup_range_in_db(self.lab_config_db, test_name, unit, sex)
        if min_v is not None and max_v is not None:
            return min_v, max_v, "hospital_lab_config", None

        # Tier 3: Trusted Reference Database
        min_v, max_v, err3 = self.lookup_range_in_db(self.trusted_db, test_name, unit, sex)
        if min_v is not None and max_v is not None:
            return min_v, max_v, "trusted_clinical_db", None

        # Tier 4: Research / Prototype Fallback (Kaggle dataset)
        min_v, max_v, err4 = self.lookup_range_in_db(self.research_fallback_db, test_name, unit, sex)
        if min_v is not None and max_v is not None:
            return min_v, max_v, "research_prototype_fallback", None

        # Determine best error description if lookup failed across all tiers
        reason = err2 if "not in database" not in err2 else (err3 if "not in database" not in err3 else err4)
        return None, None, None, reason

    def process_test_item(self, item: Dict[str, Any], sex: str, extraction_verified: bool = True) -> Dict[str, Any]:
        """
        Processes an individual lab test item through STEPS 2, 3, 4, 5.
        """
        processed = dict(item)

        test_name = item.get("test_name")
        result_raw = item.get("result")
        unit_raw = item.get("unit")

        # STEP 2 Validation Checks:
        is_name_valid = bool(test_name and isinstance(test_name, str) and test_name.strip())
        is_unit_present = bool(unit_raw is not None and str(unit_raw).strip() != "")

        is_numeric = False
        result_val = None
        if result_raw is not None and not isinstance(result_raw, bool):
            try:
                result_val = float(result_raw)
                is_numeric = True
            except (ValueError, TypeError):
                is_numeric = False

        # If required extraction fields (result numeric or unit present) fail -> INCOMPLETE
        if not is_name_valid or not is_numeric or not is_unit_present:
            processed["status"] = "INCOMPLETE"
            processed["status_reason"] = (
                f"Missing or invalid extraction fields: test_name_valid={is_name_valid}, "
                f"result_numeric={is_numeric}, unit_present={is_unit_present}"
            )
            return processed

        # Check extraction verification flag
        if not extraction_verified:
            processed["status"] = "NEEDS_REVIEW"
            processed["status_reason"] = "Extraction unverified by human or confidence threshold"
            return processed

        # STEP 3: Reference Range Priority Lookup
        min_val, max_val, tier_source, fail_reason = self.lookup_reference_range(item, sex=sex)

        if min_val is None or max_val is None:
            processed["status"] = "NEEDS_REVIEW"
            processed["status_reason"] = fail_reason or f"No applicable reference range found for test '{test_name}'"
            return processed

        # Formatted reference range output
        processed["reference_range"] = f"{min_val}-{max_val}"
        processed["reference_source"] = tier_source

        # STEP 4 & 5: Individual Result Status Determination
        if result_val < min_val:
            processed["status"] = "LOW"
        elif result_val > max_val:
            processed["status"] = "HIGH"
        else:
            processed["status"] = "NORMAL"

        return processed

    def analyze_report(self, input_data: Any) -> Dict[str, Any]:
        """
        Executes complete deterministic lab status analysis workflow (STEPS 1 - 6).
        """
        # STEP 1: Receive JSON input
        if isinstance(input_data, list):
            meta = {}
            items = input_data
        elif isinstance(input_data, dict):
            meta = {k: v for k, v in input_data.items() if k not in ["lab_results", "results", "tests"]}
            items = input_data.get("lab_results") or input_data.get("results") or input_data.get("tests") or []
        else:
            return {"overall_status": "INCOMPLETE", "error": "Invalid input JSON structure"}

        # Extract and normalize patient sex (never infer sex from name or ID)
        patient_sex = normalize_sex(meta.get("sex"))

        # Check extraction verification flag
        extraction_verified = meta.get("extraction_verified", True)

        evaluated_results = []
        statuses = []

        for item in items:
            eval_item = self.process_test_item(item, sex=patient_sex, extraction_verified=extraction_verified)
            evaluated_results.append(eval_item)
            statuses.append(eval_item.get("status"))

        # STEP 6: Determine Overall Report Status
        if "INCOMPLETE" in statuses or not statuses:
            overall_status = "INCOMPLETE"
        elif "NEEDS_REVIEW" in statuses or not extraction_verified:
            overall_status = "NEEDS_REVIEW"
        elif "LOW" in statuses or "HIGH" in statuses:
            overall_status = "ABNORMAL"
        else:
            overall_status = "NORMAL"

        report = dict(meta)
        report["sex"] = patient_sex
        report["results"] = evaluated_results
        report["overall_status"] = overall_status

        return report


def main():
    parser = argparse.ArgumentParser(description="Deterministic Medical Laboratory Test Analysis Engine")
    parser.add_argument(
        "input_file",
        nargs="?",
        type=str,
        default=str(DEFAULT_TEST_DATA_PATH),
        help="Path to input JSON report file (default: test_data.json)",
    )
    args = parser.parse_args()

    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: Input file '{input_path}' not found.", file=sys.stderr)
        sys.exit(1)

    try:
        with open(input_path, "r", encoding="utf-8") as f:
            input_data = json.load(f)
    except Exception as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        sys.exit(1)

    engine = MedicalLabStatusEngine()
    report = engine.analyze_report(input_data)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
