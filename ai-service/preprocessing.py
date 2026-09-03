import os
import shutil
import importlib

cv2 = None
np = None
try:
    cv2 = importlib.import_module("cv2")
    np = importlib.import_module("numpy")
except Exception:
    cv2 = None
    np = None

try:
    from PIL import Image, ImageEnhance, ImageFilter
except Exception:
    Image = None
    ImageEnhance = None
    ImageFilter = None


class Preprocessor:
    def __init__(self, output_dir="preprocessed"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def process_image(self, file_path: str, doc_id: str) -> str:
        """
        Enhances medical lab document images for OCR readability:
        1. Auto-scaling low-resolution / small scans to >= 1800px.
        2. Contrast Limited Adaptive Histogram Equalization (CLAHE) for faint text.
        3. Denoising and unsharp masking for sharp character boundaries.
        4. Preserves original source image intact.
        """
        preprocessed_filename = f"{doc_id}_processed.jpg"
        preprocessed_path = os.path.join(self.output_dir, preprocessed_filename)

        # 1. OpenCV Advanced Enhancement Pipeline
        if cv2 is not None and np is not None:
            try:
                img = cv2.imread(file_path)
                if img is not None:
                    h, w = img.shape[:2]

                    # Scale up if image resolution is low for small medical fonts
                    if h < 1600 or w < 1600:
                        scale_factor = max(1.5, min(3.0, 2200 / max(h, w)))
                        img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)

                    # Grayscale conversion
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

                    # Median blur to remove salt-and-pepper noise without blurring text lines
                    denoised = cv2.medianBlur(gray, 3)

                    # CLAHE (Contrast Limited Adaptive Histogram Equalization) for faint ink
                    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                    enhanced = clahe.apply(denoised)

                    # Mild unsharp masking for sharp font edges
                    gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
                    sharpened = cv2.addWeighted(enhanced, 1.3, gaussian, -0.3, 0)

                    cv2.imwrite(preprocessed_path, sharpened)
                    return preprocessed_path
            except Exception as cv_err:
                print(f"[Preprocessor] OpenCV processing notice: {cv_err}, trying PIL fallback...")

        # 2. PIL High-Quality Fallback Pipeline
        if Image is not None:
            try:
                with Image.open(file_path) as pil_img:
                    pil_img = pil_img.convert('L') # Grayscale
                    w, h = pil_img.size
                    if w < 1600 or h < 1600:
                        pil_img = pil_img.resize((int(w * 2.0), int(h * 2.0)), Image.Resampling.LANCZOS)
                    
                    # Enhance contrast
                    if ImageEnhance is not None:
                        enhancer = ImageEnhance.Contrast(pil_img)
                        pil_img = enhancer.enhance(1.6)
                        sharpness = ImageEnhance.Sharpness(pil_img)
                        pil_img = sharpness.enhance(1.4)

                    pil_img.save(preprocessed_path, "JPEG", quality=95)
                    return preprocessed_path
            except Exception as pil_err:
                print(f"[Preprocessor] PIL fallback notice: {pil_err}")

        # 3. Direct Copy Fallback
        shutil.copyfile(file_path, preprocessed_path)
        return preprocessed_path
