import cv2
import numpy as np
import os
from PIL import Image, ImageEnhance

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
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Could not read image: {file_path}")

        # 1. Resolution Check (dummy logic: upscale if too small)
        h, w = img.shape[:2]
        if h < 1000 or w < 1000:
            img = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)

        # 2. Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 3. Noise reduction (Gaussian Blur or Median Blur)
        denoised = cv2.medianBlur(gray, 3)

        # 4. Contrast adjustment (Adaptive thresholding or simple normalization)
        # Using simple normalization for better OCR read
        norm_img = np.zeros((img.shape[0], img.shape[1]))
        contrast_img = cv2.normalize(denoised, norm_img, 0, 255, cv2.NORM_MINMAX)
        
        # Binarization could be applied but EasyOCR usually works well with grayscale
        # If we were using Tesseract, we might do adaptive thresholding:
        # thresh = cv2.adaptiveThreshold(contrast_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

        # Save preprocessed image
        preprocessed_filename = f"{doc_id}_processed.jpg"
        preprocessed_path = os.path.join(self.output_dir, preprocessed_filename)
        cv2.imwrite(preprocessed_path, contrast_img)

        return preprocessed_path

    # We can add PDF and DOCX parsers here later
