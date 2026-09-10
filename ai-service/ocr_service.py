import os
import json
from typing import Dict, Any, Optional, Tuple

from ingestion import DocumentIngestion
from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from reference_range_system.engine import MedicalLabStatusEngine
from anomaly import AnomalyDetector


class OCRProcessingService:
    """
    Unified High-Precision Medical OCR & Enhancement Service.
    
    Orchestrates:
    - Multi-format conversion (PDF rendering at >=300 DPI, image upscaling).
    - Auto-sharpening, CLAHE, and adaptive binarization via OpenCV.
    - Safe Retry Mechanism with elevated contrast multiplier and DPI upscaling on low confidence / empty text.
    - Accuracy-focused clinical parameter extraction.
    - Reference range evaluation and clinical anomaly detection.
    """

    def __init__(
        self,
        preprocessed_dir: str = "preprocessed",
        raw_ocr_dir: str = "raw_ocr",
        processed_dir: str = "processed"
    ):
        self.preprocessor = Preprocessor(output_dir=preprocessed_dir)
        self.ocr_engine = OCREngine(output_dir=raw_ocr_dir)
        self.extraction_engine = ExtractionEngine(output_dir=processed_dir)
        self.status_engine = MedicalLabStatusEngine()
        self.anomaly_detector = AnomalyDetector()

    def run_pipeline(
        self,
        file_path: str,
        doc_id: str,
        confidence_threshold: float = 0.65
    ) -> Dict[str, Any]:
        """
        Executes the medical document extraction pipeline with automated OpenCV enhancement
        and safe re-try on low confidence or parsing failure.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        print(f"\n=======================================================")
        print(f"[OCR Service] Starting extraction for Document ID: {doc_id}")
        print(f"[OCR Service] Source file: {file_path}")
        print(f"=======================================================\n")

        # Step 1: Ingestion & Format Metadata
        ingestor = DocumentIngestion(file_path)
        metadata = ingestor.get_metadata()
        doc_format = metadata.get("document_format", "image")

        # Step 2: Pass 1 Preprocessing (Base Enhancement: 300 DPI, Contrast Multiplier = 1.0)
        print(f"[OCR Service] Pass 1: Applying baseline OpenCV enhancement (300 DPI, CLAHE, Sharpness Kernel)...")
        enhanced_input = self.preprocessor.process_image(
            file_path,
            doc_id,
            contrast_multiplier=1.0,
            dpi=300,
            is_retry=False
        )

        # Step 3: Pass 1 OCR Extraction
        raw_ocr_path = self.ocr_engine.perform_ocr(enhanced_input, doc_id)
        quality_metrics = self.ocr_engine.compute_ocr_quality_metrics(raw_ocr_path)
        print(f"[OCR Service] Pass 1 Quality: {quality_metrics}")

        # Step 4: Evaluate for Safe Re-try Mechanism
        needs_retry = (
            quality_metrics.get("is_low_quality", False) or
            quality_metrics.get("average_confidence", 1.0) < confidence_threshold or
            quality_metrics.get("line_count", 0) == 0
        )

        if needs_retry:
            print(f"\n[OCR Service] >>> LOW CONFIDENCE / FAINT TEXT DETECTED! <<<")
            print(f"[OCR Service] Triggering Safe Re-try with elevated contrast multiplier (1.8x) & DPI upscaling...")

            retry_input = self.preprocessor.process_image(
                file_path,
                doc_id,
                contrast_multiplier=1.8,
                dpi=400,
                is_retry=True
            )

            raw_ocr_path_retry = self.ocr_engine.perform_ocr(retry_input, f"{doc_id}_retry")
            retry_metrics = self.ocr_engine.compute_ocr_quality_metrics(raw_ocr_path_retry)
            print(f"[OCR Service] Pass 2 (Retry) Quality: {retry_metrics}")

            # If retry yielded equal or better tokens/confidence, adopt retry OCR results
            if retry_metrics.get("line_count", 0) >= quality_metrics.get("line_count", 0):
                raw_ocr_path = raw_ocr_path_retry
                quality_metrics = retry_metrics

        # Step 5: High-Precision Medical Extraction
        target_image = retry_input if (needs_retry and 'retry_input' in locals() and os.path.exists(retry_input)) else enhanced_input
        processed_json_path = self.extraction_engine.extract_medical_data(raw_ocr_path, doc_id, image_path=target_image)
        if not processed_json_path or not os.path.exists(processed_json_path):
            raise RuntimeError("Extraction engine failed to produce valid clinical output JSON.")

        with open(processed_json_path, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)

        # If extracted tests list is unexpectedly empty and not retried yet, attempt emergency retry
        extracted_tests = extracted_data.get("extracted_tests") or extracted_data.get("tests") or []
        if len(extracted_tests) == 0 and not needs_retry:
            print(f"[OCR Service] Warning: 0 tests extracted in Pass 1. Running emergency high-contrast retry...")
            retry_input = self.preprocessor.process_image(
                file_path,
                doc_id,
                contrast_multiplier=2.0,
                dpi=400,
                is_retry=True
            )
            raw_ocr_path_retry = self.ocr_engine.perform_ocr(retry_input, f"{doc_id}_retry")
            processed_json_path = self.extraction_engine.extract_medical_data(raw_ocr_path_retry, doc_id, image_path=retry_input)
            with open(processed_json_path, 'r', encoding='utf-8') as f:
                extracted_data = json.load(f)

        # Step 6: Reference Range Engine & Status Evaluation
        try:
            evaluated_data = self.status_engine.analyze_report(extracted_data)
            with open(processed_json_path, 'w', encoding='utf-8') as f:
                json.dump(evaluated_data, f, indent=2)
            extracted_data = evaluated_data
        except Exception as err:
            print(f"[OCR Service] Reference range evaluation notice: {err}")

        # Step 7: Clinical Anomaly Detection
        try:
            self.anomaly_detector.detect_anomalies(doc_id)
        except Exception as err:
            print(f"[OCR Service] Anomaly detection notice: {err}")

        # Load final persisted JSON
        with open(processed_json_path, 'r', encoding='utf-8') as f:
            final_result = json.load(f)

        # Attach image preprocessing and OCR quality metadata
        final_result["preprocessing_metadata"] = {
            "source_format": doc_format,
            "dpi_rendered": 400 if needs_retry else 300,
            "clahe_applied": True,
            "sharpness_filtering": True,
            "adaptive_binarization": True,
            "retry_executed": needs_retry,
            "ocr_quality": quality_metrics
        }

        return final_result
