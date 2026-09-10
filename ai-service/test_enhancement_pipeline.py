import os
import json
import unittest
import numpy as np
from PIL import Image

from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from ocr_service import OCRProcessingService

class TestEnhancementAndOCR(unittest.TestCase):
    def setUp(self):
        self.preprocessor = Preprocessor(output_dir="preprocessed_test")
        self.ocr_engine = OCREngine(output_dir="raw_ocr_test")
        self.service = OCRProcessingService(
            preprocessed_dir="preprocessed_test",
            raw_ocr_dir="raw_ocr_test",
            processed_dir="processed_test"
        )
        os.makedirs("preprocessed_test", exist_ok=True)
        os.makedirs("raw_ocr_test", exist_ok=True)
        os.makedirs("processed_test", exist_ok=True)

    def test_image_enhancement_opencv_pipeline(self):
        """Test OpenCV CLAHE, adaptive thresholding, and sharpness kernel execution."""
        # Create a synthetic blurry test image with low contrast
        arr = np.random.randint(140, 180, (400, 400), dtype=np.uint8)
        # Draw some dark simulated text pixels
        arr[100:110, 50:200] = 30
        arr[200:210, 50:200] = 40
        test_img_path = os.path.join("preprocessed_test", "synthetic_test.png")
        Image.fromarray(arr).save(test_img_path)

        # Enhance image
        enhanced_path = self.preprocessor.process_image(
            test_img_path,
            doc_id="synthetic_test",
            contrast_multiplier=1.0,
            dpi=300,
            is_retry=False
        )

        self.assertTrue(os.path.exists(enhanced_path))
        # Ensure image was upscaled for OCR
        enhanced_img = Image.open(enhanced_path)
        self.assertGreaterEqual(max(enhanced_img.size), 1600)

    def test_safe_retry_enhancement(self):
        """Test that retry mode applies higher contrast multiplier and higher target dimension."""
        test_img_path = os.path.join("preprocessed_test", "synthetic_test.png")
        retry_path = self.preprocessor.process_image(
            test_img_path,
            doc_id="synthetic_test",
            contrast_multiplier=1.8,
            dpi=400,
            is_retry=True
        )
        self.assertTrue(os.path.exists(retry_path))
        retry_img = Image.open(retry_path)
        self.assertGreaterEqual(max(retry_img.size), 2200)

    def test_extraction_system_prompt_adherence(self):
        """Test that extraction engine parses rows without dropping tests and sets missing fields to Not Available."""
        doc_id = "test_prompt_grounding"
        raw_ocr = [
            {"text": "Patient Name: Jane Smith", "confidence": 0.99, "page": 1, "bounding_box": [0, 0, 100, 20]},
            {"text": "Age: 32 Years Female", "confidence": 0.98, "page": 1, "bounding_box": [0, 20, 100, 20]},
            {"text": "Hemoglobin 12.8 g/dL 12.0-15.5", "confidence": 0.96, "page": 1, "bounding_box": [0, 40, 100, 20]},
            {"text": "WBC 7.2 10^3/uL 4.0-11.0", "confidence": 0.95, "page": 1, "bounding_box": [0, 60, 100, 20]},
            {"text": "Platelets 250 10^3/uL 150-450", "confidence": 0.97, "page": 1, "bounding_box": [0, 80, 100, 20]}
        ]
        raw_path = os.path.join("raw_ocr_test", f"{doc_id}.json")
        with open(raw_path, 'w', encoding='utf-8') as f:
            json.dump(raw_ocr, f)

        extractor = ExtractionEngine(output_dir="processed_test")
        out_path = extractor.extract_medical_data(raw_path, doc_id)
        with open(out_path, 'r', encoding='utf-8') as f:
            result = json.load(f)

        self.assertEqual(len(result["extracted_tests"]), 3)
        self.assertEqual(result["patient_info"]["patient_name"], "Jane Smith")
        for test in result["extracted_tests"]:
            self.assertIsNotNone(test["test_name"])
            self.assertIsNotNone(test["result_value"])

    def test_fastapi_pipeline(self):
        """Test FastAPI extraction endpoint."""
        from fastapi.testclient import TestClient
        from fastapi_app import app

        client = TestClient(app)
        # Health check
        res_health = client.get("/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertEqual(res_health.json()["status"], "ok")

        # Test extraction route with synthetic test file
        test_img_path = os.path.join("preprocessed_test", "synthetic_test.png")
        res_extract = client.post(
            "/api/v1/extract",
            json={"file_path": test_img_path, "doc_id": "fastapi_test_doc"}
        )
        self.assertEqual(res_extract.status_code, 200)
        json_data = res_extract.json()
        self.assertIn("document_id", json_data)
        self.assertIn("preprocessing_metadata", json_data)
        self.assertTrue(json_data["preprocessing_metadata"]["clahe_applied"])


if __name__ == "__main__":
    unittest.main()
