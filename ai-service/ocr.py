import easyocr
import json
import os

class OCREngine:
    def __init__(self, output_dir="raw_ocr"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        # Initialize EasyOCR reader (requires downloading models first time)
        # Using English only for now
        print("Initializing EasyOCR... (This may take a moment)")
        self.reader = easyocr.Reader(['en'], gpu=False, verbose=False) # fallback to CPU if GPU not available

    def perform_ocr(self, image_path: str, doc_id: str) -> str:
        """
        Extracts text, confidence, and bounding boxes.
        Saves raw OCR data to JSON. Auto-rotates if confidence is too low.
        """
        print(f"Running OCR on {image_path}...")
        
        import cv2
        img = cv2.imread(image_path)
        
        def get_ocr_and_conf(img_arr):
            results = self.reader.readtext(img_arr)
            if not results: return results, 0
            # Calculate average confidence for words > 2 chars
            confs = [prob for (bbox, text, prob) in results if len(text) > 2]
            avg_conf = sum(confs) / len(confs) if confs else 0
            return results, avg_conf

        # Try original
        results, avg_conf = get_ocr_and_conf(img)
        print(f"Original orientation average confidence: {avg_conf:.4f}")

        best_results = results
        best_img = img

        if avg_conf < 0.5:
            print("Confidence is low. Trying 180 degree rotation...")
            rotated_180 = cv2.rotate(img, cv2.ROTATE_180)
            results_180, conf_180 = get_ocr_and_conf(rotated_180)
            print(f"180 degree rotation average confidence: {conf_180:.4f}")
            
            if conf_180 > avg_conf:
                best_results = results_180
                best_img = rotated_180
                # Overwrite image so the UI shows it correctly
                cv2.imwrite(image_path, best_img)
                print("Image was upside down. Re-saved rotated image.")

        extracted_data = []
        for (bbox, text, prob) in best_results:
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

        output_file = os.path.join(self.output_dir, f"{doc_id}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, indent=2)
            
        print(f"Raw OCR saved to {output_file}")
        return output_file

