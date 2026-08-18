import json
import os

class OCREngine:
    def __init__(self, output_dir="raw_ocr"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        print("Initializing EasyOCR... (This may take a moment)")
        try:
            import easyocr
            self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            print(f"EasyOCR initialization fallback: {e}")
            self.reader = None

    def perform_ocr(self, image_path: str, doc_id: str) -> str:
        """
        Extracts text, confidence, and page metadata from PDF or Image documents.
        Saves raw OCR data to JSON.
        """
        print(f"Running OCR on {image_path}...")
        extracted_data = []

        # 1. PDF Text Extraction
        if image_path.lower().endswith('.pdf'):
            try:
                import pdfplumber
                with pdfplumber.open(image_path) as pdf:
                    for page_idx, page in enumerate(pdf.pages):
                        text = page.extract_text()
                        if text:
                            for line in text.split('\n'):
                                line_clean = line.strip()
                                if line_clean:
                                    extracted_data.append({
                                        "text": line_clean,
                                        "confidence": 0.99,
                                        "page": page_idx + 1,
                                        "bounding_box": [0, 0, 100, 20]
                                    })
            except Exception as pdf_err:
                print(f"pdfplumber extraction failed: {pdf_err}, trying pypdf...")
                try:
                    import pypdf
                    reader = pypdf.PdfReader(image_path)
                    for page_idx, page in enumerate(reader.pages):
                        text = page.extract_text()
                        if text:
                            for line in text.split('\n'):
                                line_clean = line.strip()
                                if line_clean:
                                    extracted_data.append({
                                        "text": line_clean,
                                        "confidence": 0.99,
                                        "page": page_idx + 1,
                                        "bounding_box": [0, 0, 100, 20]
                                    })
                except Exception as pypdf_err:
                    print(f"pypdf extraction error: {pypdf_err}")

        # 2. Image OCR Execution
        if not extracted_data and self.reader is not None and not image_path.lower().endswith('.pdf'):
            try:
                import cv2
                img = cv2.imread(image_path)
                if img is not None:
                    results = self.reader.readtext(img)
                    for (bbox, text, prob) in results:
                        x_coords = [point[0] for point in bbox]
                        y_coords = [point[1] for point in bbox]
                        x = int(min(x_coords))
                        y = int(min(y_coords))
                        w = int(max(x_coords) - min(x_coords))
                        h = int(max(y_coords) - min(y_coords))

                        extracted_data.append({
                            "text": text,
                            "confidence": round(float(prob), 4),
                            "page": 1,
                            "bounding_box": [x, y, w, h]
                        })
            except Exception as err:
                print(f"OCR execution warning: {err}")

        # NO HARDCODED DUMMY FALLBACK DATA!
        if not extracted_data:
            print(f"[OCR] Warning: No text lines could be extracted from {image_path}")

        output_file = os.path.join(self.output_dir, f"{doc_id}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=2)
            
        print(f"Raw OCR saved to {output_file}")
        return output_file


