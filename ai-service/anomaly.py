import json
import os

class AnomalyDetector:
    def __init__(self, processed_dir="processed", raw_dir="raw_ocr"):
        self.processed_dir = processed_dir
        self.raw_dir = raw_dir

    def detect_anomalies(self, doc_id: str):
        """
        Detects discrepancies between the OCR output and the LLM extracted values.
        """
        processed_path = os.path.join(self.processed_dir, f"{doc_id}.json")
        raw_path = os.path.join(self.raw_dir, f"{doc_id}.json")

        if not os.path.exists(processed_path) or not os.path.exists(raw_path):
            print(f"Missing files for anomaly detection for {doc_id}")
            return

        with open(processed_path, 'r', encoding='utf-8') as f:
            processed_data = json.load(f)
            
        with open(raw_path, 'r', encoding='utf-8') as f:
            raw_ocr = json.load(f)

        # Collect all raw text into a single string for easy substring checking
        # In a more robust system, we would do fuzzy matching or token-by-token comparison
        raw_text_combined = " ".join([item['text'] for item in raw_ocr]).lower()

        needs_verification_global = False
        
        for test in processed_data.get("tests", []):
            result_str = str(test.get("result", "")).lower()
            
            # If the result is not found exactly in the raw OCR text, flag it
            # This handles cases like OCR="18", LLM="1.8"
            if result_str and result_str not in raw_text_combined:
                test["needs_verification"] = True
                test["reason"] = "extraction_disagreement"
                needs_verification_global = True
            else:
                test["needs_verification"] = False
                
        if needs_verification_global:
            processed_data["extraction_status"] = "needs_verification"
            
        # Overwrite the processed JSON with anomaly flags
        with open(processed_path, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, indent=2)
            
        print(f"Anomaly detection completed for {doc_id}")
        return processed_path
