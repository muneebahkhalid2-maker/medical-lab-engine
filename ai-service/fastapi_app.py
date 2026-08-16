import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ingestion import DocumentIngestion
from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from anomaly import AnomalyDetector
import json

app = FastAPI(title="MedExtract AI Service", description="Document extraction and clinical intelligence engine")

class ExtractRequest(BaseModel):
    file_path: str
    doc_id: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AI Engine"}

@app.post("/api/v1/extract")
def extract_document(request: ExtractRequest):
    file_path = request.file_path
    doc_id = request.doc_id

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    print(f"Starting pipeline for Document ID: {doc_id}")

    try:
        # 1. Ingestion
        ingestor = DocumentIngestion(file_path)
        metadata = ingestor.get_metadata()

        # 2. Preprocessing
        preprocessor = Preprocessor()
        if metadata["document_format"] == "image":
            processed_img_path = preprocessor.process_image(file_path, doc_id)
        else:
            raise HTTPException(status_code=400, detail="Only image formats are fully supported in this V1 demo.")

        # 3. OCR Layer
        ocr_engine = OCREngine()
        raw_ocr_path = ocr_engine.perform_ocr(processed_img_path, doc_id)

        # 4. LLM Extraction
        extractor = ExtractionEngine()
        processed_json_path = extractor.extract_medical_data(raw_ocr_path, doc_id)

        if not processed_json_path or not os.path.exists(processed_json_path):
             raise HTTPException(status_code=500, detail="Extraction failed to produce output JSON")

        # 5. Anomaly Detection
        anomaly_detector = AnomalyDetector()
        anomaly_detector.detect_anomalies(doc_id)

        # Load the final processed JSON to return
        with open(processed_json_path, 'r', encoding='utf-8') as f:
            final_data = json.load(f)

        return final_data

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="127.0.0.1", port=8000, reload=True)
