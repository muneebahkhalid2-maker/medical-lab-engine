import os
import glob
import json
from ingestion import DocumentIngestion
from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from reference_range_system.engine import MedicalLabStatusEngine
from anomaly import AnomalyDetector

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_batch():
    lab_reports_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "Sample_LabReports"))
    if not os.path.exists(lab_reports_dir):
        lab_reports_dir = os.path.join(BASE_DIR, "preprocessed")

    image_files = glob.glob(os.path.join(lab_reports_dir, "*.jpeg")) + glob.glob(os.path.join(lab_reports_dir, "*.jpg"))
    
    if not image_files:
        print(f"No images found in {lab_reports_dir}.")
        return

    print(f"Found {len(image_files)} images to process.")
    
    # Initialize engines once to save load time
    print("Initializing engines...")
    preprocessor = Preprocessor()
    ocr_engine = OCREngine()
    extractor = ExtractionEngine()
    status_engine = MedicalLabStatusEngine()
    anomaly_detector = AnomalyDetector()
    
    for i, file_path in enumerate(image_files, 1):
        doc_id = os.path.splitext(os.path.basename(file_path))[0]
        print(f"\n=======================================================")
        print(f"Processing ({i}/{len(image_files)}): {doc_id}")
        print(f"=======================================================")
        
        try:
            # 1. Ingestion
            ingestor = DocumentIngestion(file_path)
            metadata = ingestor.get_metadata()
            
            if metadata["document_format"] != "image":
                print("Skipping non-image file.")
                continue
                
            # 2. Preprocessing
            processed_img_path = preprocessor.process_image(file_path, doc_id)
            
            # 3. OCR Layer
            raw_ocr_path = ocr_engine.perform_ocr(processed_img_path, doc_id)
            
            # 4. LLM Extraction
            processed_json_path = extractor.extract_medical_data(raw_ocr_path, doc_id)
            
            if processed_json_path and os.path.exists(processed_json_path):
                # 5. Reference Range Engine & Status Evaluation
                with open(processed_json_path, 'r', encoding='utf-8') as f:
                    extracted_data = json.load(f)

                evaluated_data = status_engine.analyze_report(extracted_data)
                with open(processed_json_path, 'w', encoding='utf-8') as f:
                    json.dump(evaluated_data, f, indent=2)

                # 6. Anomaly Detection
                anomaly_detector.detect_anomalies(doc_id)
                print(f"Successfully finished: {doc_id}")
            else:
                print(f"Failed extraction for: {doc_id}")
                
        except Exception as e:
            print(f"ERROR processing {doc_id}: {e}")

if __name__ == "__main__":
    run_batch()
