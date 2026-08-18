import json
import os
import re
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
                print(f"Genai init error: {err}")
                self.model = None
        else:
            self.model = None

    def _map_to_source(self, extracted_value: str, raw_ocr: list) -> dict:
        """
        Attempts to map an extracted value back to the OCR bounding boxes and confidence.
        Very naive implementation for demonstration.
        """
        if not extracted_value:
            return {"confidence": 0.0, "source": None}

        # Simple substring search
        best_match = None
        for item in raw_ocr:
            if extracted_value.lower() in item['text'].lower() or item['text'].lower() in extracted_value.lower():
                best_match = item
                break
        
        if best_match:
            return {
                "confidence": best_match['confidence'],
                "source": {
                    "page": best_match['page'],
                    "bounding_box": best_match['bounding_box']
                }
            }
        return {"confidence": 0.8, "source": None} # fallback confidence

    def extract_medical_data(self, raw_ocr_path: str, doc_id: str) -> str:
        """
        Uses an LLM to parse the OCR text into structured JSON.
        """
        with open(raw_ocr_path, 'r', encoding='utf-8') as f:
            raw_ocr = json.load(f)

        # Reconstruct text block for the LLM
        # In a real scenario, we might pass the JSON directly, but plain text saves tokens
        full_text = "\n".join([item['text'] for item in raw_ocr])

        prompt = f"""
        You are a medical data extraction system. You are NOT responsible for deciding if a result is normal, high, low, critical, etc. DO NOT CALCULATE STATUS.
        
        Extract the laboratory test results from the following OCR text.
        
        Rules:
        1. Extract fields: Patient name, Patient ID, Age, Sex, Report date, Laboratory, Test name, Result, Unit, Reference range.
        2. If a field is not present, use value: null.
        3. Preserve column relationships in tables.
        4. Normalize the test name (e.g., "HGB" -> "Hemoglobin"), but keep the original as well in "test_name_raw".
        5. Return ONLY a valid JSON object. No markdown formatting, no backticks.
        
        Expected JSON format:
        {{
            "document_id": "{doc_id}",
            "document_type": "laboratory_report",
            "patient": {{
                "name": "...",
                "age": ...,
                "sex": "..."
            }},
            "report": {{
                "date": "...",
                "laboratory": "..."
            }},
            "tests": [
                {{
                    "testName": "...",
                    "result": ...,
                    "unit": "...",
                    "referenceRange": {{
                        "raw": "...",
                        "low": ...,
                        "high": ...
                    }}
                }}
            ]
        }}
        
        OCR Text:
        {full_text}
        """

        try:
            print("Calling LLM for extraction...")
            if self.model is None or getattr(self.model, '_api_key', 'dummy_key') == "dummy_key":
                print("Extracting laboratory tests directly from raw OCR text lines...")
                extracted_json = self.parse_text_lines_deterministically(raw_ocr, doc_id)
            else:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        response_mime_type="application/json"
                    )
                )
                extracted_json = json.loads(response.text)
            
            
            # Post-process to add confidence and source mapping
            # And format the final JSON according to Step 14
            final_tests = []
            for test in extracted_json.get("tests", []):
                # We try to map the test result back to the original OCR to get bounding box
                mapping = self._map_to_source(str(test.get("result", "")), raw_ocr)
                
                final_test = {
                    "testName": test.get("testName"),
                    "result": test.get("result"),
                    "unit": test.get("unit"),
                    "referenceRange": test.get("referenceRange"),
                    "confidence": mapping["confidence"],
                    "source": mapping["source"]
                }
                final_tests.append(final_test)
                
            extracted_json["tests"] = final_tests
            extracted_json["extraction_status"] = "unverified"
            
            output_file = os.path.join(self.output_dir, f"{doc_id}.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(extracted_json, f, indent=2)
                
            print(f"Processed extraction saved to {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error during extraction: {e}")
            return ""
