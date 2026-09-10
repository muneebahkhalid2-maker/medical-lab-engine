import os
import shutil
import importlib
from typing import List, Tuple, Optional, Union

cv2 = None
np = None
try:
    cv2 = importlib.import_module("cv2")
    np = importlib.import_module("numpy")
except Exception as e:
    cv2 = None
    np = None

try:
    from PIL import Image, ImageEnhance, ImageFilter, ImageOps
except Exception:
    Image = None
    ImageEnhance = None
    ImageFilter = None
    ImageOps = None

pdf2image = None
try:
    pdf2image = importlib.import_module("pdf2image")
except Exception:
    pdf2image = None

pypdfium2 = None
try:
    pypdfium2 = importlib.import_module("pypdfium2")
except Exception:
    pypdfium2 = None


class Preprocessor:
    """
    Automated Image & PDF Enhancement Pipeline for Medical Document OCR.
    
    Features:
    - 300+ DPI Multi-page PDF to Image Conversion (pdf2image with pypdfium2/pdfplumber fallbacks).
    - Intelligent Upscaling for low-resolution/blurry scans.
    - Grayscale Conversion (cv2.cvtColor).
    - Contrast Limited Adaptive Histogram Equalization (CLAHE) for faint text.
    - Gaussian Blur + Adaptive Thresholding (Binarization) to separate text from background.
    - Sharpness Kernel Matrix Filtering to crisp up numeric results and decimal points.
    - Multi-stage Retry Enhancement with elevated contrast multipliers & DPI upscaling.
    """

    def __init__(self, output_dir: str = "preprocessed"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def convert_pdf_to_images(self, pdf_path: str, doc_id: str, dpi: int = 300) -> List[str]:
        """
        Renders each page of a PDF document at high resolution (>=300 DPI) into preprocessed image files.
        Tries pdf2image (poppler) first, and falls back seamlessly to pypdfium2 or pdfplumber if needed.
        """
        rendered_image_paths = []
        os.makedirs(self.output_dir, exist_ok=True)

        # Method 1: pdf2image (Poppler)
        if pdf2image is not None:
            try:
                images = pdf2image.convert_from_path(pdf_path, dpi=dpi)
                for page_idx, pil_img in enumerate(images):
                    page_filename = f"{doc_id}_page_{page_idx + 1}.png"
                    out_path = os.path.join(self.output_dir, page_filename)
                    pil_img.save(out_path, "PNG")
                    rendered_image_paths.append(out_path)
                if rendered_image_paths:
                    print(f"[Preprocessor] Converted {len(rendered_image_paths)} pages via pdf2image at {dpi} DPI")
                    return rendered_image_paths
            except Exception as pdf2img_err:
                print(f"[Preprocessor] pdf2image notice: {pdf2img_err}. Switching to high-res pypdfium2 fallback...")

        # Method 2: pypdfium2 (Self-contained, no external poppler binary required, high precision)
        if pypdfium2 is not None:
            try:
                pdf = pypdfium2.PdfDocument(pdf_path)
                # 300 DPI = scale factor of 300 / 72 ~= 4.1667
                scale = dpi / 72.0
                for page_idx, page in enumerate(pdf):
                    bitmap = page.render(scale=scale)
                    pil_image = bitmap.to_pil()
                    page_filename = f"{doc_id}_page_{page_idx + 1}.png"
                    out_path = os.path.join(self.output_dir, page_filename)
                    pil_image.save(out_path, "PNG")
                    rendered_image_paths.append(out_path)
                if rendered_image_paths:
                    print(f"[Preprocessor] Rendered {len(rendered_image_paths)} pages via pypdfium2 at {dpi} DPI")
                    return rendered_image_paths
            except Exception as pypdfium_err:
                print(f"[Preprocessor] pypdfium2 fallback notice: {pypdfium_err}")

        # Method 3: pdfplumber page image rendering fallback
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    page_img = page.to_image(resolution=dpi)
                    page_filename = f"{doc_id}_page_{page_idx + 1}.png"
                    out_path = os.path.join(self.output_dir, page_filename)
                    page_img.save(out_path, format="PNG")
                    rendered_image_paths.append(out_path)
            if rendered_image_paths:
                print(f"[Preprocessor] Rendered {len(rendered_image_paths)} pages via pdfplumber at {dpi} DPI")
                return rendered_image_paths
        except Exception as plumber_err:
            print(f"[Preprocessor] pdfplumber render error: {plumber_err}")

        return rendered_image_paths

    def enhance_cv2_image(
        self,
        image_path: str,
        output_path: str,
        contrast_multiplier: float = 1.0,
        dpi_target: int = 300,
        is_retry: bool = False
    ) -> bool:
        """
        Applies OpenCV Image Processing Pipeline:
        1. Multi-scale bicubic upscaling for small/blurry characters.
        2. Grayscale conversion (`cv2.cvtColor`).
        3. Contrast Limited Adaptive Histogram Equalization (`CLAHE`) for faint ink.
        4. Gaussian Blur + Adaptive Thresholding (Binarization).
        5. Sharpness Kernel matrix filtering to crisp up decimal points and numeric values.
        """
        if cv2 is None or np is None:
            return False

        try:
            img = cv2.imread(image_path)
            if img is None:
                return False

            h, w = img.shape[:2]

            # 1. High-Resolution Upscaling (Target >= 2200px on major axis, or higher on retry)
            target_dim = 3000 if is_retry else 2200
            if max(h, w) < target_dim or min(h, w) < 1600:
                scale_factor = max(1.5, target_dim / max(h, w))
                if is_retry:
                    scale_factor = max(scale_factor, 2.0)
                img = cv2.resize(img, None, fx=scale_factor, fy=scale_factor, interpolation=cv2.INTER_CUBIC)

            # 2. Grayscale Conversion
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clip_limit = max(2.0, min(5.0, 2.5 * contrast_multiplier))
            tile_grid = (8, 8) if not is_retry else (6, 6)
            clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid)
            enhanced_clahe = clahe.apply(gray)

            # 4. Gaussian Blur + Noise Suppression
            # Mild kernel to eliminate scanning artifacts without softening tiny font serifs
            blurred = cv2.GaussianBlur(enhanced_clahe, (3, 3), 0)

            # 5. Sharpness Kernel Matrix Filtering
            # Specialized 3x3 high-pass unsharp kernel matrix designed for tabular clinical reports
            center_weight = 5.0 + (1.2 * contrast_multiplier)
            sharpness_kernel = np.array([
                [0, -1, 0],
                [-1, center_weight, -1],
                [0, -1, 0]
            ], dtype=np.float32)

            # Normalize kernel response
            kernel_sum = np.sum(sharpness_kernel)
            if kernel_sum > 0:
                sharpness_kernel = sharpness_kernel / kernel_sum

            sharpened = cv2.filter2D(blurred, -1, sharpness_kernel)

            # 6. Adaptive Thresholding / Binarization Fusion
            # Create adaptive binarized layer to isolate dark printed ink from uneven lighting/shadows
            block_size = 15 if not is_retry else 19
            c_val = 8 if not is_retry else 10
            adaptive_thresh = cv2.adaptiveThreshold(
                sharpened,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                block_size,
                c_val
            )

            # Blend sharpened grayscale with adaptive threshold for clean background and intact grayscale antialiasing
            # Weight: 70% sharpened CLAHE detail + 30% binarized high-contrast text separation
            blended = cv2.addWeighted(sharpened, 0.70, adaptive_thresh, 0.30, 0)

            # Final contrast adjustment
            if contrast_multiplier > 1.0:
                alpha = min(1.4, 1.0 + 0.2 * (contrast_multiplier - 1.0))
                blended = cv2.convertScaleAbs(blended, alpha=alpha, beta=2)

            cv2.imwrite(output_path, blended)
            return True

        except Exception as err:
            print(f"[Preprocessor] OpenCV enhancement error: {err}")
            return False

    def enhance_pil_image(
        self,
        image_path: str,
        output_path: str,
        contrast_multiplier: float = 1.0,
        is_retry: bool = False
    ) -> bool:
        """
        PIL-based High-Precision Fallback Enhancement Pipeline.
        """
        if Image is None:
            return False

        try:
            with Image.open(image_path) as pil_img:
                pil_img = pil_img.convert('L')  # Grayscale
                w, h = pil_img.size

                # Upscale
                target_min = 2000 if is_retry else 1600
                if w < target_min or h < target_min:
                    scale = max(1.5, target_min / min(w, h))
                    pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

                # Contrast Enhancement
                if ImageEnhance is not None:
                    enhancer = ImageEnhance.Contrast(pil_img)
                    pil_img = enhancer.enhance(1.6 * contrast_multiplier)

                    sharpness = ImageEnhance.Sharpness(pil_img)
                    pil_img = sharpness.enhance(1.8 * contrast_multiplier)

                # Autocontrast
                if ImageOps is not None:
                    pil_img = ImageOps.autocontrast(pil_img, cutoff=1)

                pil_img.save(output_path, "PNG")
                return True

        except Exception as pil_err:
            print(f"[Preprocessor] PIL enhancement error: {pil_err}")
            return False

    def process_image(
        self,
        file_path: str,
        doc_id: str,
        contrast_multiplier: float = 1.0,
        dpi: int = 300,
        is_retry: bool = False
    ) -> Union[str, List[str]]:
        """
        Main pipeline entrypoint for processing images and PDFs:
        - If input is PDF: renders pages at >=300 DPI, enhances each page, returns list of enhanced images.
        - If input is Image: upscales, sharpens, applies CLAHE and adaptive binarization.
        """
        suffix = "_retry.png" if is_retry else "_enhanced.png"
        is_pdf = file_path.lower().endswith(".pdf")

        if is_pdf:
            rendered_pages = self.convert_pdf_to_images(file_path, doc_id, dpi=dpi)
            if not rendered_pages:
                print(f"[Preprocessor] Warning: PDF conversion produced 0 images for {file_path}")
                return file_path

            enhanced_pages = []
            for idx, page_img in enumerate(rendered_pages):
                page_out = os.path.join(self.output_dir, f"{doc_id}_page_{idx + 1}{suffix}")
                success = self.enhance_cv2_image(
                    page_img,
                    page_out,
                    contrast_multiplier=contrast_multiplier,
                    dpi_target=dpi,
                    is_retry=is_retry
                )
                if not success:
                    success = self.enhance_pil_image(
                        page_img,
                        page_out,
                        contrast_multiplier=contrast_multiplier,
                        is_retry=is_retry
                    )
                enhanced_pages.append(page_out if success else page_img)

            return enhanced_pages if len(enhanced_pages) > 1 else enhanced_pages[0]

        # Single Image Processing
        output_path = os.path.join(self.output_dir, f"{doc_id}{suffix}")
        success = self.enhance_cv2_image(
            file_path,
            output_path,
            contrast_multiplier=contrast_multiplier,
            dpi_target=dpi,
            is_retry=is_retry
        )
        if not success:
            success = self.enhance_pil_image(
                file_path,
                output_path,
                contrast_multiplier=contrast_multiplier,
                is_retry=is_retry
            )

        if success and os.path.exists(output_path):
            return output_path

        # Direct copy fallback if all enhancements fail
        fallback_path = os.path.join(self.output_dir, f"{doc_id}_raw.png")
        shutil.copyfile(file_path, fallback_path)
        return fallback_path
