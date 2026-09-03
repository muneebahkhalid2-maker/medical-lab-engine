import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ingestion import DocumentIngestion
from preprocessing import Preprocessor
from ocr import OCREngine
from extraction import ExtractionEngine
from reference_range_system.engine import MedicalLabStatusEngine
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

    # If file_path is a remote URL (e.g. Cloudinary), download it first
    if file_path.startswith("http://") or file_path.startswith("https://"):
        try:
            import requests
            os.makedirs("downloads", exist_ok=True)
            ext = ".jpg"
            if ".pdf" in file_path.lower():
                ext = ".pdf"
            elif ".docx" in file_path.lower():
                ext = ".docx"
            elif ".png" in file_path.lower():
                ext = ".png"
            elif ".jpeg" in file_path.lower():
                ext = ".jpeg"
            downloaded_path = os.path.join("downloads", f"{doc_id}{ext}")
            resp = requests.get(file_path, timeout=45)
            if resp.status_code == 200:
                with open(downloaded_path, "wb") as f:
                    f.write(resp.content)
                file_path = downloaded_path
            else:
                raise HTTPException(status_code=400, detail=f"Failed to download remote file from Cloudinary: HTTP {resp.status_code}")
        except Exception as dl_err:
            print(f"[AI Service] Remote download notice: {dl_err}")
            raise HTTPException(status_code=400, detail=f"Error downloading remote file: {dl_err}")

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
            processed_img_path = file_path

        # 3. OCR Layer
        ocr_engine = OCREngine()
        raw_ocr_path = ocr_engine.perform_ocr(processed_img_path, doc_id)

        # 4. LLM Extraction
        extractor = ExtractionEngine()
        processed_json_path = extractor.extract_medical_data(raw_ocr_path, doc_id)

        if not processed_json_path or not os.path.exists(processed_json_path):
             raise HTTPException(status_code=500, detail="Extraction failed to produce output JSON")

        # 5. Reference Range Engine & Status Evaluation
        with open(processed_json_path, 'r', encoding='utf-8') as f:
            extracted_data = json.load(f)

        status_engine = MedicalLabStatusEngine()
        evaluated_data = status_engine.analyze_report(extracted_data)

        with open(processed_json_path, 'w', encoding='utf-8') as f:
            json.dump(evaluated_data, f, indent=2)

        # 6. Anomaly Detection
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
