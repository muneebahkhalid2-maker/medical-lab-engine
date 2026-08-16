import os
import glob
from ingestion import DocumentIngestion
from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from anomaly import AnomalyDetector

def run_batch():
    lab_reports_dir = r"C:\Users\hashi\medaDoc\LabReports"
    image_files = glob.glob(os.path.join(lab_reports_dir, "*.jpeg"))
    
    if not image_files:
        print("No images found.")
        return

    print(f"Found {len(image_files)} images to process.")
    
    # Initialize engines once to save load time (especially PyTorch for OCR)
    print("Initializing engines...")
    preprocessor = Preprocessor()
    ocr_engine = OCREngine()
    extractor = ExtractionEngine()
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
            
            # 3. OCR
            raw_ocr_path = ocr_engine.perform_ocr(processed_img_path, doc_id)
            
            # 4. LLM Extraction
            processed_json_path = extractor.extract_medical_data(raw_ocr_path, doc_id)
            
            # 5. Anomaly Detection
            if processed_json_path:
                anomaly_detector.detect_anomalies(doc_id)
                print(f"Successfully finished: {doc_id}")
            else:
                print(f"Failed extraction for: {doc_id}")
                
        except Exception as e:
            print(f"ERROR processing {doc_id}: {e}")

if __name__ == "__main__":
    run_batch()
