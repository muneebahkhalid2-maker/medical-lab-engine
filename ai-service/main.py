import os
import argparse
from ingestion import DocumentIngestion
from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from anomaly import AnomalyDetector

def main():
    parser = argparse.ArgumentParser(description="Medical Document Extraction Pipeline")
    parser.add_argument("file_path", help="Path to the medical document")
    args = parser.parse_args()

    file_path = args.file_path
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    # Derive a simple document ID from the filename
    doc_id = os.path.splitext(os.path.basename(file_path))[0]
    print(f"Starting pipeline for Document ID: {doc_id}")

    # 1. Ingestion
    print("\n--- Step 1 & 2: Ingestion ---")
    ingestor = DocumentIngestion(file_path)
    metadata = ingestor.get_metadata()
    print(f"Metadata: {metadata}")

    # 2. Preprocessing
    print("\n--- Step 3 & 4: Preprocessing ---")
    preprocessor = Preprocessor()
    if metadata["document_format"] == "image":
        processed_img_path = preprocessor.process_image(file_path, doc_id)
        print(f"Preprocessed image saved to: {processed_img_path}")
    else:
        print("Only image formats are fully supported in this V1 demo.")
        return

    # 3. OCR Layer
    print("\n--- Step 5 & 6: OCR ---")
    ocr_engine = OCREngine()
    raw_ocr_path = ocr_engine.perform_ocr(processed_img_path, doc_id)

    # 4. LLM Extraction
    print("\n--- Step 7-11: LLM Extraction ---")
    if not os.environ.get("GEMINI_API_KEY"):
         print("WARNING: GEMINI_API_KEY environment variable not set. Extraction will likely fail.")
    
    extractor = ExtractionEngine()
    processed_json_path = extractor.extract_medical_data(raw_ocr_path, doc_id)

    if processed_json_path:
        # 5. Anomaly Detection
        print("\n--- Step 12: Anomaly Detection ---")
        anomaly_detector = AnomalyDetector()
        anomaly_detector.detect_anomalies(doc_id)
        
        print("\nPipeline completed!")
        print(f"To verify, run: streamlit run app.py")
        print(f"And enter Document ID: {doc_id}")
    else:
        print("\nPipeline failed during extraction.")

if __name__ == "__main__":
    main()
