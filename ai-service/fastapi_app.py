import os
import json
# pyrefly: ignore [missing-import]
import uvicorn
import mimetypes
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from ocr_service import OCRProcessingService

app = FastAPI(
    title="MedExtract AI Service",
    description="High-Precision Medical Document Enhancement, OCR & Clinical Intelligence Engine"
)

class ExtractRequest(BaseModel):
    file_path: str
    doc_id: str

# Instantiate singleton OCR processing service
ocr_service = OCRProcessingService()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "MedExtract High-Precision AI Engine",
        "features": [
            "300+ DPI PDF Multi-Page Rendering",
            "OpenCV CLAHE & Adaptive Binarization",
            "Sharpness Matrix Kernel Filtering",
            "Safe Re-try on Low OCR Confidence",
            "Row-by-Row Clinical Parameter Extraction",
            "Robust Cloudinary Format Detection"
        ]
    }

def _detect_file_extension(content: bytes, content_type: str, original_path: str) -> str:
    """
    Accurately detects file extension from magic bytes, MIME Content-Type header, or URL path.
    """
    # 1. Inspect Magic Bytes
    if content.startswith(b"%PDF"):
        return ".pdf"
    if content.startswith(b"\x89PNG"):
        return ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if content.startswith(b"RIFF") and b"WEBP" in content[:16]:
        return ".webp"
    if content.startswith(b"PK\x03\x04"):
        return ".docx"

    # 2. Inspect MIME Content-Type
    if content_type:
        ct = content_type.lower()
        if "pdf" in ct:
            return ".pdf"
        if "png" in ct:
            return ".png"
        if "jpeg" in ct or "jpg" in ct:
            return ".jpg"
        if "webp" in ct:
            return ".webp"
        if "word" in ct or "officedocument" in ct:
            return ".docx"

    # 3. Inspect URL string
    lower_path = original_path.lower()
    for candidate in [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".doc"]:
        if candidate in lower_path:
            return candidate

    return ".png"

@app.post("/api/v1/extract")
def extract_document(request: ExtractRequest):
    file_path = request.file_path
    doc_id = request.doc_id

    # If file_path is a remote URL (e.g. Cloudinary/S3), download it locally first
    if file_path.startswith("http://") or file_path.startswith("https://"):
        try:
            import requests
            os.makedirs("downloads", exist_ok=True)
            
            resp = requests.get(file_path, timeout=60)
            if resp.status_code == 200:
                content_type = resp.headers.get("Content-Type", "")
                ext = _detect_file_extension(resp.content, content_type, file_path)
                
                downloaded_path = os.path.join("downloads", f"{doc_id}{ext}")
                with open(downloaded_path, "wb") as f:
                    f.write(resp.content)
                file_path = downloaded_path
                print(f"[FastAPI Extraction] Downloaded remote file to {file_path} (Detected Format: {ext})")
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to download remote file from Cloudinary: HTTP {resp.status_code}"
                )
        except Exception as dl_err:
            print(f"[FastAPI Extraction] Remote download notice: {dl_err}")
            raise HTTPException(status_code=400, detail=f"Error downloading remote file: {dl_err}")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    try:
        # Run end-to-end enhanced pipeline with automated OpenCV pre-processing & safe retry
        result = ocr_service.run_pipeline(
            file_path=file_path,
            doc_id=doc_id,
            confidence_threshold=0.65
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="127.0.0.1", port=8000, reload=True)
