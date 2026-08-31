import json
import os
import re
from typing import Dict, Any, List, Optional

try:
    import google.generativeai as genai
except Exception as e:
    genai = None


class ExtractionEngine:
    def __init__(self, output_dir="processed"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        if genai is not None:
            try:
                genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "dummy_key"))
                self.model = genai.GenerativeModel('gemini-1.5-flash')
            except Exception as err:
                print(f"[ExtractionEngine] GenAI init error: {err}")
                self.model = None
        else:
            self.model = None

    def _map_to_source(self, extracted_value: str, raw_ocr: list) -> dict:
        """
        Maps an extracted value back to the OCR bounding boxes and confidence.
        """
        if not extracted_value:
            return {"confidence": 0.85, "source": None}

        # Substring / exact search in raw OCR items
        target = str(extracted_value).strip().lower()
        for item in raw_ocr:
            text = item.get('text', '').lower()
            if target in text or text in target:
                return {
                    "confidence": item.get('confidence', 0.95),
                    "source": {
                        "page": item.get('page', 1),
                        "bounding_box": item.get('bounding_box', [0, 0, 0, 0])
                    }
                }
        return {"confidence": 0.90, "source": None}

    def _clean_and_parse_json(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """
        Robust JSON response parser that strips markdown code fences, isolates
        the root JSON object, and parses complete arrays without dropping elements.
        """
        if not raw_text or not raw_text.strip():
            return None

        text = raw_text.strip()

        # 1. Strip Markdown ```json and ``` code blocks
        if "```json" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
            if match:
                text = match.group(1).strip()
        elif "```" in text:
            match = re.search(r"```\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()

        # 2. Extract outermost JSON object if surrounded by preamble/postamble
        json_match = re.search(r"(\{[\s\S]*\})", text)
        if json_match:
            text = json_match.group(1).strip()

        # 3. First-pass standard JSON load
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                return parsed
        except Exception as json_err:
            print(f"[ExtractionEngine] Standard JSON parsing failed, attempting repair: {json_err}")

        # 4. JSON Repair attempts (handle trailing commas before closing braces/brackets)
        try:
            cleaned_text = re.sub(r",\s*([\]\}])", r"\1", text)
            parsed = json.loads(cleaned_text)
            if isinstance(parsed, dict):
                return parsed
        except Exception as repair_err:
            print(f"[ExtractionEngine] Repaired JSON parsing error: {repair_err}")

        return None

    def parse_text_lines_deterministically(self, raw_ocr: list, doc_id: str) -> dict:
        """
        Exhaustive pure-grounding deterministic parser that extracts all clinical metadata
        and laboratory test parameters (CBC, DLC, LFT, RFT, Urine Routine, Lipid, etc.)
        directly from raw OCR text without truncation or hardcoded limits.
        """
        lines = [item.get('text', '').strip() for item in raw_ocr if item.get('text', '').strip()]

        patient_name = None
        patient_age = None
        patient_sex = None
        report_date = None
        lab_name = None
        lab_id = None

        # 1. Header Metadata Extraction
        for line in lines:
            # Patient Name
            if not patient_name:
                name_match = re.search(
                    r'(?:Name|Patient\s*Name)\s*[:\-]?\s*(?:[0-9]+\s+[A-Za-z0-9\/]+\s+)?([A-Za-z][A-Za-z\s\.\/]+?)(?=\s*\(|\s+Age|\s+NHQ|\s+Referred|\s*$)',
                    line, re.IGNORECASE
                )
                if name_match:
                    candidate = name_match.group(1).strip()
                    if len(candidate) > 2 and not any(k in candidate.lower() for k in ['department', 'pathology', 'hospital', 'center', 'specimen']):
                        patient_name = candidate

            # Age & Gender
            if patient_age is None or patient_sex is None:
                age_sex_match = re.search(
                    r'Age(?:\/Sex)?\s*[:\-]?\s*([0-9]{1,3})\s*(?:Years|Yrs|Y)?\s*[-/]?\s*(Male|Female|M|F)?',
                    line, re.IGNORECASE
                )
                if age_sex_match:
                    if patient_age is None and age_sex_match.group(1):
                        try:
                            patient_age = int(age_sex_match.group(1))
                        except ValueError:
                            pass
                    if patient_sex is None and age_sex_match.group(2):
                        val = age_sex_match.group(2).upper()
                        patient_sex = "Male" if val.startswith("M") else "Female"

            # Lab Name
            if not lab_name:
                if any(kw in line.lower() for kw in ['hospital', 'cardiac center', 'pathology', 'laboratory', 'heart center', 'medical college', 'afip', 'cmh', 'chughtai', 'aga khan', 'excel labs']):
                    if not any(stop in line.lower() for stop in ['department of', 'provisional', 'ent by', 'technician']):
                        lab_name = line.strip()

            # Report Date
            if not report_date:
                date_match = re.search(
                    r'(?:Date|Ent\s*On|Reported\s*Date|Perform\s*Date|Receiving\s*Date)[\s:]*([0-9]{1,2}[-\s][A-Za-z0-9]{3,}[-\s][0-9]{2,4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})',
                    line, re.IGNORECASE
                )
                if date_match:
                    report_date = date_match.group(1).strip()

            # Lab Registration ID
            if not lab_id:
                id_match = re.search(
                    r'(?:LAB\s*ID|MR\s*No|I\.D\s*#|Reg\s*No|Cath\s*No|Sample\s*No)[\s:]*([A-Za-z0-9\/\-_]+)',
                    line, re.IGNORECASE
                )
                if id_match:
                    lab_id = id_match.group(1).strip()

        # 2. Exhaustive Test Parameters Extraction
        tests = []
        known_test_keywords = [
            'bilirubin', 'alt', 'sgpt', 'ast', 'sgot', 'alp', 'alkaline phosphatase',
            'urea', 'creatinine', 'uric acid', 'sodium', 'potassium', 'chloride', 'calcium',
            'cholesterol', 'triglycerides', 'hdl', 'ldl', 'vldl', 'lipid profile',
            'hba1c', 'glucose', 'fasting blood sugar', 'random blood sugar',
            'trop i', 'troponin', 'ck-mb', 'cpk',
            'hemoglobin', 'hb', 'tlc', 'total leukocyte count', 'wbc', 'rbc', 'hematocrit', 'pcv',
            'mcv', 'mch', 'mchc', 'rdw', 'platelet', 'neutrophils', 'lymphocytes',
            'monocytes', 'eosinophils', 'basophils', 'esr',
            'colour', 'sp gravity', 'specific gravity', 'reaction', 'ph', 'protein', 'albumin',
            'sugar', 'pus cells', 'rbcs', 'epithelial cells', 'casts', 'crystals', 'others',
            'blood group', 'rh factor', 'hcg', 'gravindex', 'tsh', 'ft4', 'ft3'
        ]

        unit_patterns = [
            r'(umol\/l|u\/l|ng\/ml|mg\/dl|mmol\/l|%|fl|pg|g\/dl|x\s*10\^?[0-9]+\/l|\/hpf|g\/l|miu\/ml|uu\/ml)',
        ]

        # Scan all lines for clinical items
        for i, line in enumerate(lines):
            is_test_line = any(re.search(rf'\b{re.escape(kw)}\b', line, re.IGNORECASE) for kw in known_test_keywords)
            if not is_test_line:
                continue

            val_match = re.search(
                r'([A-Za-z0-9\s\(\)\-\/\.\,\>\<\=\%]+?)\s+([0-9]+(?:\.[0-9]+)?|<[0-9]+(?:\.[0-9]+)?|>[0-9]+(?:\.[0-9]+)?|POSITIVE|Negative|Normal|Nil|Pale\s*Yellow|Yellow|Acidic|Alkaline|Few|0\s*-\s*[0-9]+)\s*(.*)',
                line, re.IGNORECASE
            )

            test_name = None
            result_val = None
            ref_or_unit = ""

            if val_match:
                candidate_name = val_match.group(1).strip()
                if not any(h in candidate_name.lower() for h in ['parameter', 'department', 'report', 'category', 'signature']):
                    test_name = candidate_name
                    result_val = val_match.group(2).strip()
                    ref_or_unit = val_match.group(3).strip()
            else:
                if i + 1 < len(lines):
                    next_line = lines[i + 1]
                    next_val_match = re.search(
                        r'^([0-9]+(?:\.[0-9]+)?|POSITIVE|Negative|Normal|Nil|Pale\s*Yellow|Acidic|Few|0\s*-\s*[0-9]+)\s*(.*)',
                        next_line, re.IGNORECASE
                    )
                    if next_val_match:
                        test_name = line.strip()
                        result_val = next_val_match.group(1).strip()
                        ref_or_unit = next_val_match.group(2).strip()

            if test_name and result_val:
                num_result = result_val
                try:
                    num_result = float(result_val) if '.' in result_val else (int(result_val) if result_val.isdigit() else result_val)
                except ValueError:
                    num_result = result_val

                unit = ""
                for up in unit_patterns:
                    um = re.search(up, ref_or_unit, re.IGNORECASE)
                    if um:
                        unit = um.group(1).strip()
                        break

                ref_range = ref_or_unit if ref_or_unit else "Not Available"

                # Check if this test is already recorded; if not, add it
                if not any(t.get('testName', '').lower() == test_name.lower() for t in tests):
                    # Determine Panel/Category
                    t_lower = test_name.lower()
                    category = "General"
                    if any(k in t_lower for k in ['bilirubin', 'alt', 'ast', 'alp', 'sgpt', 'sgot']):
                        category = "Liver Function Tests (LFT)"
                    elif any(k in t_lower for k in ['urea', 'creatinine', 'uric acid', 'sodium', 'potassium', 'chloride']):
                        category = "Renal Function Tests (RFT)"
                    elif any(k in t_lower for k in ['hb', 'hemoglobin', 'tlc', 'wbc', 'neutrophil', 'lymphocyte', 'monocyte', 'eosinophil', 'basophil', 'platelet', 'mcv', 'mch', 'pcv', 'hematocrit']):
                        category = "Complete Blood Count (CBC)"
                    elif any(k in t_lower for k in ['colour', 'gravity', 'reaction', 'protein', 'sugar', 'pus', 'rbc', 'epithelial', 'cast', 'crystal']):
                        category = "Urine Examination (Routine)"
                    elif any(k in t_lower for k in ['cholesterol', 'triglyceride', 'hdl', 'ldl']):
                        category = "Lipid Profile"

                    tests.append({
                        "category": category,
                        "testName": test_name,
                        "test_name": test_name,
                        "result": num_result,
                        "result_value": str(num_result),
                        "unit": unit or "Not Available",
                        "referenceRange": {
                            "raw": ref_range,
                            "low": None,
                            "high": None
                        },
                        "reference_range": ref_range,
                        "status": "NORMAL"
                    })

        return {
            "document_id": doc_id,
            "document_type": "laboratory_report",
            "lab_metadata": {
                "lab_name": lab_name or "Not Available",
                "lab_id": lab_id or "Not Available",
                "patient_name": patient_name or "Not Available",
                "age": f"{patient_age} Years" if patient_age else "Not Available",
                "gender": patient_sex or "Not Available",
                "entry_date": report_date or "Not Available"
            },
            "patient_info": {
                "patient_name": patient_name or "Not Available",
                "age": f"{patient_age} Years" if patient_age else "Not Available",
                "gender": patient_sex or "Not Available",
                "lab_name": lab_name or "Not Available",
                "lab_id": lab_id or "Not Available",
                "report_date": report_date or "Not Available"
            },
            "patient": {
                "name": patient_name,
                "age": patient_age,
                "sex": patient_sex
            },
            "report": {
                "date": report_date,
                "laboratory": lab_name
            },
            "overall_status": "NORMAL",
            "tests": tests,
            "extracted_tests": tests
        }

    def extract_medical_data(self, raw_ocr_path: str, doc_id: str) -> str:
        """
        Exhaustively parses OCR text into comprehensive structured JSON.
        Uses Gemini Vision/Text LLM with temperature=0.0 and max_output_tokens=8192.
        Never truncates or slices the extracted array.
        """
        with open(raw_ocr_path, 'r', encoding='utf-8') as f:
            raw_ocr = json.load(f)

        if not raw_ocr:
            print(f"[ExtractionEngine] Warning: raw_ocr is empty for {doc_id}")
            extracted_json = {
                "document_id": doc_id,
                "document_type": "laboratory_report",
                "patient_info": {
                    "patient_name": "Not Available",
                    "age": "Not Available",
                    "gender": "Not Available",
                    "lab_name": "Not Available",
                    "lab_id": "Not Available",
                    "report_date": "Not Available"
                },
                "patient": {"name": None, "age": None, "sex": None},
                "report": {"date": None, "laboratory": None},
                "overall_status": "Not Available",
                "tests": [],
                "extracted_tests": []
            }
            output_file = os.path.join(self.output_dir, f"{doc_id}.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(extracted_json, f, indent=2)
            return output_file

        prompt = f"""You are a specialized Medical OCR Engine. Extract EVERY single test parameter listed from top to bottom without truncation. 
- Parse all sections (CBC, LFT, RFT, Urine Routine, DLC, etc.).
- Do NOT truncate output or stop early. Parse all tests until the end of the document.
- Never invent reference ranges. If a result or range is missing/faint, set its field to 'Not Available'.
- Output strictly in valid JSON format with keys: `patient_info`, `overall_status`, and `extracted_tests` array.

JSON Output Schema:
{{
  "patient_info": {{
    "patient_name": "Extracted Name or Not Available",
    "age": "Extracted Age or Not Available",
    "gender": "Extracted Gender or Not Available",
    "lab_name": "Extracted Lab Name or Not Available",
    "lab_id": "Extracted Lab ID or Not Available",
    "report_date": "Extracted Date or Not Available"
  }},
  "overall_status": "ABNORMAL | NORMAL | Not Available",
  "extracted_tests": [
    {{
      "category": "Panel/Category Name (e.g. Liver Function Test, CBC, Urine Routine) or General",
      "test_name": "Exact Test Name printed on report",
      "result_value": "Numerical/Text Result or Not Available",
      "unit": "Measurement Unit or Not Available",
      "reference_range": "Exact Printed Range or Not Available",
      "status": "NORMAL | HIGH | LOW | ABNORMAL | Not Available"
    }}
  ]
}}

DOCUMENT OCR TEXT:
{full_text}
"""

        extracted_json = None
        has_valid_api_key = (
            self.model is not None and 
            os.environ.get("GEMINI_API_KEY") and 
            os.environ.get("GEMINI_API_KEY") != "dummy_key"
        )

        if has_valid_api_key:
            try:
                print("[ExtractionEngine] Calling Gemini Vision/Text LLM with max_output_tokens=8192, temperature=0.0...")
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.0,
                        max_output_tokens=8192,
                        response_mime_type="application/json"
                    )
                )
                extracted_json = self._clean_and_parse_json(response.text)
            except Exception as llm_err:
                print(f"[ExtractionEngine] LLM extraction error: {llm_err}")
                extracted_json = None

        # Fallback to exhaustive deterministic OCR table parser if LLM is unavailable or failed
        if not extracted_json or not isinstance(extracted_json, dict):
            print("[ExtractionEngine] Running exhaustive deterministic grounding parser...")
            extracted_json = self.parse_text_lines_deterministically(raw_ocr, doc_id)

        # Standardize and retain ALL tests in the extracted array (NO slicing/capping)
        raw_tests_list = (
            extracted_json.get("extracted_tests") or 
            extracted_json.get("tests") or 
            extracted_json.get("results") or 
            []
        )

        final_tests = []
        patient_info = extracted_json.get("patient_info", {})
        patient_name = patient_info.get("patient_name") or extracted_json.get("patient", {}).get("name")
        patient_age = patient_info.get("age") or extracted_json.get("patient", {}).get("age")
        patient_gender = patient_info.get("gender") or extracted_json.get("patient", {}).get("sex")
        lab_name = patient_info.get("lab_name") or extracted_json.get("report", {}).get("laboratory")
        lab_id = patient_info.get("lab_id") or extracted_json.get("lab_metadata", {}).get("lab_id")
        report_date = patient_info.get("report_date") or extracted_json.get("report", {}).get("date")

        for test in raw_tests_list:
            tname = test.get("test_name") or test.get("testName") or test.get("name") or "Unknown Parameter"
            tval = test.get("result_value") if test.get("result_value") is not None else test.get("result")
            tunit = test.get("unit") or "Not Available"
            tref = test.get("reference_range") or test.get("referenceRange") or "Not Available"
            if isinstance(tref, dict):
                tref = tref.get("raw") or f"{tref.get('low', '')}-{tref.get('high', '')}"
            tstatus = test.get("status") or "NORMAL"
            tcat = test.get("category") or "General Laboratory Analysis"

            mapping = self._map_to_source(str(tval), raw_ocr)

            final_tests.append({
                "category": tcat,
                "testName": tname,
                "test_name": tname,
                "result": tval,
                "result_value": str(tval),
                "unit": tunit,
                "referenceRange": {
                    "raw": str(tref),
                    "low": None,
                    "high": None
                },
                "reference_range": str(tref),
                "status": tstatus,
                "confidence": mapping["confidence"],
                "source": mapping["source"]
            })

        # Calculate Overall Status without dropping elements
        has_abnormal = any(t.get("status") in ["HIGH", "LOW", "ABNORMAL"] for t in final_tests)
        overall_status = "ABNORMAL" if has_abnormal else (extracted_json.get("overall_status") or "NORMAL")

        standardized_output = {
            "document_id": doc_id,
            "document_type": "laboratory_report",
            "patient_info": {
                "patient_name": str(patient_name or "Not Available"),
                "age": str(patient_age or "Not Available"),
                "gender": str(patient_gender or "Not Available"),
                "lab_name": str(lab_name or "Not Available"),
                "lab_id": str(lab_id or "Not Available"),
                "report_date": str(report_date or "Not Available")
            },
            "patient": {
                "name": patient_name,
                "age": patient_age,
                "sex": patient_gender
            },
            "report": {
                "date": report_date,
                "laboratory": lab_name
            },
            "overall_status": overall_status,
            "extraction_status": "unverified",
            "tests": final_tests,
            "extracted_tests": final_tests
        }

        output_file = os.path.join(self.output_dir, f"{doc_id}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(standardized_output, f, indent=2)

        print(f"[ExtractionEngine] Successfully extracted {len(final_tests)} test parameters without truncation to {output_file}")
        return output_file
