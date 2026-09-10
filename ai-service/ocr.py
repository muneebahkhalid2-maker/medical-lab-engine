import json
import os
import zipfile
import xml.etree.ElementTree as ET
from typing import Union, List, Dict, Any, Tuple

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

    def _ocr_single_image(self, image_path: str, page_num: int = 1) -> List[Dict[str, Any]]:
        """Runs OCR on a single image file and returns structured text tokens and line detections."""
        page_results = []
        if self.reader is not None:
            try:
                import cv2
                img = cv2.imread(image_path)
                if img is not None:
                    results = self.reader.readtext(img)
                    for (bbox, text, prob) in results:
                        text_clean = text.strip()
                        if not text_clean:
                            continue
                        x_coords = [point[0] for point in bbox]
                        y_coords = [point[1] for point in bbox]
                        x = int(min(x_coords))
                        y = int(min(y_coords))
                        w = int(max(x_coords) - min(x_coords))
                        h = int(max(y_coords) - min(y_coords))

                        page_results.append({
                            "text": text_clean,
                            "confidence": round(float(prob), 4),
                            "page": page_num,
                            "bounding_box": [x, y, w, h]
                        })
            except Exception as err:
                print(f"[OCREngine] EasyOCR execution warning on {image_path}: {err}")
        return page_results

    def perform_ocr(self, target_input: Union[str, List[str]], doc_id: str) -> str:
        """
        Extracts text, confidence scores, and bounding boxes from PDF, DOCX, or enhanced images.
        Saves raw OCR data to JSON and returns file path.
        """
        extracted_data = []

        # Case 1: Input is a list of enhanced page images (from PDF multi-page preprocessing)
        if isinstance(target_input, list):
            print(f"[OCREngine] Running multi-page OCR across {len(target_input)} enhanced pages...")
            for page_idx, img_path in enumerate(target_input):
                page_data = self._ocr_single_image(img_path, page_num=page_idx + 1)
                extracted_data.extend(page_data)

        # Case 2: Input is a single string file path
        elif isinstance(target_input, str):
            image_path = target_input
            print(f"[OCREngine] Running OCR/Text extraction on {image_path}...")

            # 2a. DOCX Extraction
            if image_path.lower().endswith('.docx') or image_path.lower().endswith('.doc'):
                extracted_data = self._extract_docx(image_path)

            # 2b. PDF Native Text Extraction fallback
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
                    print(f"[OCREngine] pdfplumber fallback: {pdf_err}, trying pypdf...")
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
                        print(f"[OCREngine] pypdf extraction error: {pypdf_err}")

            # 2c. Image OCR Execution
            if not extracted_data and not image_path.lower().endswith('.pdf') and not image_path.lower().endswith('.docx'):
                extracted_data = self._ocr_single_image(image_path, page_num=1)

        if not extracted_data:
            print(f"[OCREngine] Notice: No text lines could be extracted from input")

        output_file = os.path.join(self.output_dir, f"{doc_id}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=2)

        print(f"[OCREngine] Raw OCR saved to {output_file} (extracted {len(extracted_data)} tokens/lines)")
        return output_file

    def compute_ocr_quality_metrics(self, raw_ocr_path: str) -> Dict[str, Any]:
        """
        Calculates OCR extraction quality metrics (average confidence, line count, token count).
        Used by the Safe Retry Mechanism to trigger elevated enhancement if quality is below threshold.
        """
        if not os.path.exists(raw_ocr_path):
            return {"line_count": 0, "average_confidence": 0.0, "min_confidence": 0.0, "is_low_quality": True}

        try:
            with open(raw_ocr_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not data:
                return {"line_count": 0, "average_confidence": 0.0, "min_confidence": 0.0, "is_low_quality": True}

            confidences = [item.get("confidence", 0.0) for item in data if "confidence" in item]
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            min_conf = min(confidences) if confidences else 0.0

            # Flag as low quality if less than 3 lines found or average confidence is poor (< 0.65)
            is_low_quality = len(data) < 3 or avg_conf < 0.65

            return {
                "line_count": len(data),
                "average_confidence": round(avg_conf, 4),
                "min_confidence": round(min_conf, 4),
                "is_low_quality": is_low_quality
            }
        except Exception as err:
            print(f"[OCREngine] Quality calculation error: {err}")
            return {"line_count": 0, "average_confidence": 0.0, "min_confidence": 0.0, "is_low_quality": True}
