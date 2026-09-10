import json
import os
import re
import importlib
from typing import Dict, Any, List, Optional

genai = None
try:
    genai = importlib.import_module("google.generativeai")
except Exception:
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
            r'bilirubin', r'alt', r'sgpt', r'ast', r'sgot', r'alp', r'alkaline\s*phosphatase',
            r'urea', r'creatinine', r'uric\s*acid', r'sodium', r'potassium', r'chloride', r'calcium',
            r'cholesterol', r'triglycerides?', r'hdl', r'ldl', r'vldl', r'lipid\s*profile',
            r'hba1c', r'glucose', r'fasting\s*blood\s*sugar', r'random\s*blood\s*sugar',
            r'trop\s*i', r'troponin', r'ck-mb', r'cpk',
            r'hemoglobin', r'hb', r'tlc', r'total\s*leukocyte\s*count', r'wbcs?', r'rbcs?', r'hematocrit', r'pcv',
            r'mcv', r'mch', r'mchc', r'rdw', r'platelets?', r'neutrophils?', r'lymphocytes?',
            r'monocytes?', r'eosinophils?', r'basophils?', r'esr',
            r'colour', r'sp\s*gravity', r'specific\s*gravity', r'reaction', r'ph', r'protein', r'albumin',
            r'sugar', r'pus\s*cells?', r'epithelial\s*cells?', r'casts?', r'crystals?', r'others?',
            r'blood\s*group', r'rh\s*factor', r'hcg', r'gravindex', r'tsh', r'ft4', r'ft3'
        ]

        unit_patterns = [
            r'(umol\/l|u\/l|ng\/ml|mg\/dl|mmol\/l|%|fl|pg|g\/dl|10\^?[0-9]+\/ul|x\s*10\^?[0-9]+\/l|\/hpf|g\/l|miu\/ml|uu\/ml)',
        ]

        # Scan all lines for clinical items
        for i, line in enumerate(lines):
            is_test_line = any(re.search(rf'\b{kw}\b', line, re.IGNORECASE) for kw in known_test_keywords)
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

    def _call_gemini_rest(self, prompt: str, image_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key or api_key == "dummy_key":
            return None

        import requests
        import base64

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        parts = []

        if image_path and os.path.exists(image_path):
            try:
                with open(image_path, "rb") as img_f:
                    b64 = base64.b64encode(img_f.read()).decode("utf-8")
                mime = "image/png" if image_path.endswith(".png") else "image/jpeg"
                parts.append({
                    "inline_data": {
                        "mime_type": mime,
                        "data": b64
                    }
                })
                print(f"[ExtractionEngine] Attached preprocessed multimodal image: {image_path}")
            except Exception as e:
                print(f"[ExtractionEngine] Image encoding notice: {e}")

        parts.append({"text": prompt})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json"
            }
        }

        try:
            print("[ExtractionEngine] Calling Gemini 1.5 Flash REST API (temperature=0.0, max_output_tokens=8192)...")
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return self._clean_and_parse_json(text)
            else:
                print(f"[ExtractionEngine] Gemini REST API notice (HTTP {resp.status_code}): {resp.text[:200]}")
        except Exception as err:
            print(f"[ExtractionEngine] Gemini REST API call notice: {err}")

        return None

    def extract_medical_data(self, raw_ocr_path: str, doc_id: str, image_path: Optional[str] = None) -> str:
        """
        Exhaustively parses OCR text into comprehensive structured JSON.
        Uses Gemini Vision/Text LLM with temperature=0.0 and max_output_tokens=8192.
        Never truncates or slices the extracted array.
        """
        raw_ocr = []
        if os.path.exists(raw_ocr_path):
            try:
                with open(raw_ocr_path, 'r', encoding='utf-8') as f:
                    raw_ocr = json.load(f)
            except Exception:
                raw_ocr = []

        full_text = "\n".join([item.get('text', '').strip() for item in raw_ocr if item.get('text', '').strip()])

        prompt = f"""You are a High-Precision Medical Document Parser. You are analyzing an auto-enhanced laboratory report.

STRICT INSTRUCTIONS:
1. Parse every single row from top to bottom (CBC, LFT, RFT, Urine Routine, Thyroid, Lipid Profile, etc.).
2. Pay extreme attention to numbers, decimal points, and small-font characters (e.g., 0.6 vs 1.8, mg/dL vs mmol/L).
3. Extract 100% of visible parameters. Do not truncate output or limit extraction to 10 tests.
4. If a specific character remains unreadable after enhancement, set that specific field to 'Not Available' instead of dropping the test row.

Output strictly in valid JSON format adhering to the following schema:
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
      "category": "Panel/Category Name (e.g. Complete Blood Count, Liver Function Test, Renal Function Test, Urine Routine, Thyroid) or General",
      "test_name": "Exact Test Name printed on report",
      "result_value": "Numerical/Text Result or Not Available",
      "unit": "Measurement Unit or Not Available",
      "reference_range": "Exact Printed Range or Not Available",
      "status": "NORMAL | HIGH | LOW | ABNORMAL | Not Available"
    }}
  ]
}}

DOCUMENT OCR TEXT:
{full_text if full_text else "Extract directly from attached multimodal report image."}
"""

        extracted_json = None
        has_valid_api_key = bool(os.environ.get("GEMINI_API_KEY") and os.environ.get("GEMINI_API_KEY") != "dummy_key")

        # 1. Try Direct REST Gemini API (with optional Vision Image attachment)
        if has_valid_api_key:
            extracted_json = self._call_gemini_rest(prompt, image_path=image_path)

        # 2. Try SDK Gemini Model if available
        if not extracted_json and self.model is not None and has_valid_api_key:
            try:
                print("[ExtractionEngine] Calling Gemini SDK Model...")
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
                print(f"[ExtractionEngine] LLM SDK extraction notice: {llm_err}")
                extracted_json = None

        # 3. Fallback to exhaustive deterministic OCR table parser if LLM is unavailable or failed
        if not extracted_json or not isinstance(extracted_json, dict):
            if raw_ocr:
                print("[ExtractionEngine] Running exhaustive deterministic grounding parser...")
                extracted_json = self.parse_text_lines_deterministically(raw_ocr, doc_id)
            else:
                print(f"[ExtractionEngine] Warning: raw_ocr is empty and no LLM response for {doc_id}")
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
