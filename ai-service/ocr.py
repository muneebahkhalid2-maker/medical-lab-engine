import json
import os
import zipfile
import xml.etree.ElementTree as ET

class OCREngine:
    def __init__(self, output_dir="raw_ocr"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.reader = None
        try:
            import easyocr
            print("Initializing EasyOCR...")
            self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        except Exception as e:
            print(f"EasyOCR initialization notice: {e}")
            self.reader = None

    def _extract_docx(self, docx_path: str) -> list:
        """Extracts text and table rows from a .docx file without external dependencies."""
        extracted_data = []
        try:
            with zipfile.ZipFile(docx_path) as z:
                xml_content = z.read('word/document.xml')
                tree = ET.fromstring(xml_content)
                namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                
                # Extract paragraphs and table cells
                for p_idx, p in enumerate(tree.iterfind('.//w:p', namespaces)):
                    texts = [node.text for node in p.iterfind('.//w:t', namespaces) if node.text]
                    line_text = "".join(texts).strip()
                    if line_text:
                        extracted_data.append({
                            "text": line_text,
                            "confidence": 1.0,
                            "page": 1,
                            "bounding_box": [0, p_idx * 20, 100, 20]
                        })
        except Exception as docx_err:
            print(f"DOCX extraction error: {docx_err}")
        return extracted_data

    def perform_ocr(self, image_path: str, doc_id: str) -> str:
        """
        Extracts text, confidence, and page metadata from PDF, DOCX, or Image documents.
        Saves raw OCR data to JSON.
        """
        print(f"Running OCR/Text extraction on {image_path}...")
        extracted_data = []

        # 1. DOCX Extraction
        if image_path.lower().endswith('.docx') or image_path.lower().endswith('.doc'):
            extracted_data = self._extract_docx(image_path)

        # 2. PDF Text Extraction
        elif image_path.lower().endswith('.pdf'):
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
                print(f"pdfplumber extraction fallback: {pdf_err}, trying pypdf...")
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

        # 3. Image OCR Execution
        if not extracted_data and not image_path.lower().endswith('.pdf') and not image_path.lower().endswith('.docx'):
            if self.reader is not None:
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
                                "text": text.strip(),
                                "confidence": round(float(prob), 4),
                                "page": 1,
                                "bounding_box": [x, y, w, h]
                            })
                except Exception as err:
                    print(f"OCR execution warning: {err}")

        # Strict grounding: NO HARDCODED DUMMY FALLBACK DATA!
        if not extracted_data:
            print(f"[OCR] Notice: No text lines could be extracted from {image_path}")

        output_file = os.path.join(self.output_dir, f"{doc_id}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=2)
            
        print(f"Raw OCR saved to {output_file}")
        return output_file


