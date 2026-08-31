import os
import json
import unittest
from ocr import OCREngine
from extraction import ExtractionEngine

class TestExtractionGrounding(unittest.TestCase):
    def setUp(self):
        self.ocr_engine = OCREngine(output_dir="raw_ocr_test")
        self.extraction_engine = ExtractionEngine(output_dir="processed_test")
        self.sample_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Sample_LabReports")

    def test_document_isolation(self):
        """Test that sequential extractions do not leak state or previous patient data."""
        os.makedirs("raw_ocr_test", exist_ok=True)
        # Create a mock raw OCR for a distinct patient
        doc1_id = "patient_a"
        doc1_raw = [
            {"text": "PAC Hospital Kamra", "confidence": 0.98, "page": 1, "bounding_box": [0, 0, 100, 20]},
            {"text": "Patient Name: AREEBA SHAHID", "confidence": 0.99, "page": 1, "bounding_box": [0, 20, 100, 20]},
            {"text": "Age: 28 Years Female", "confidence": 0.97, "page": 1, "bounding_box": [0, 40, 100, 20]},
            {"text": "Serum ALT 35 u/l", "confidence": 0.95, "page": 1, "bounding_box": [0, 60, 100, 20]}
        ]
        raw1_path = os.path.join("raw_ocr_test", f"{doc1_id}.json")
        with open(raw1_path, 'w', encoding='utf-8') as f:
            json.dump(doc1_raw, f)

        res1_path = self.extraction_engine.extract_medical_data(raw1_path, doc1_id)
        with open(res1_path, 'r', encoding='utf-8') as f:
            res1 = json.load(f)

        self.assertIn("AREEBA", str(res1.get("patient", {}).get("name", "")))

        # Process a second document with different patient
        doc2_id = "patient_b"
        doc2_raw = [
            {"text": "City Clinical Lab", "confidence": 0.98, "page": 1, "bounding_box": [0, 0, 100, 20]},
            {"text": "Patient Name: JOHN DOE", "confidence": 0.99, "page": 1, "bounding_box": [0, 20, 100, 20]},
            {"text": "Age: 45 Years Male", "confidence": 0.97, "page": 1, "bounding_box": [0, 40, 100, 20]},
            {"text": "Urea 15 mg/dl", "confidence": 0.95, "page": 1, "bounding_box": [0, 60, 100, 20]}
        ]
        raw2_path = os.path.join("raw_ocr_test", f"{doc2_id}.json")
        with open(raw2_path, 'w', encoding='utf-8') as f:
            json.dump(doc2_raw, f)

        res2_path = self.extraction_engine.extract_medical_data(raw2_path, doc2_id)
        with open(res2_path, 'r', encoding='utf-8') as f:
            res2 = json.load(f)

        # Confirm no leakage of patient A into patient B
        self.assertNotIn("AREEBA", str(res2))
        self.assertIn("JOHN", str(res2.get("patient", {}).get("name", "")))

if __name__ == "__main__":
    unittest.main()
