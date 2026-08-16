try:
    import cv2
    import numpy as np
except Exception as e:
    cv2 = None
    np = None
import os
try:
    from PIL import Image, ImageEnhance
except Exception as e:
    Image = None
    ImageEnhance = None

class Preprocessor:
    def __init__(self, output_dir="preprocessed"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def process_image(self, file_path: str, doc_id: str) -> str:
        """
        Processes an image and returns the path to the preprocessed version.
        Always preserves the original image.
        """
        # Load image
        try:
            import cv2
            import numpy as np
            img = cv2.imread(file_path)
            if img is not None:
                # 1. Resolution Check
                h, w = img.shape[:2]
                if h < 1000 or w < 1000:
                    img = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

                # 2. Grayscale
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                denoised = cv2.medianBlur(gray, 3)
                norm_img = np.zeros((img.shape[0], img.shape[1]))
                contrast_img = cv2.normalize(denoised, norm_img, 0, 255, cv2.NORM_MINMAX)

                preprocessed_filename = f"{doc_id}_processed.jpg"
                preprocessed_path = os.path.join(self.output_dir, preprocessed_filename)
                cv2.imwrite(preprocessed_path, contrast_img)
                return preprocessed_path
        except Exception as err:
            print(f"Preprocessing fallback enabled: {err}")

        preprocessed_filename = f"{doc_id}_processed.jpg"
        preprocessed_path = os.path.join(self.output_dir, preprocessed_filename)
        import shutil
        shutil.copyfile(file_path, preprocessed_path)
        return preprocessed_path

    # We can add PDF and DOCX parsers here later
