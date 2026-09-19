"""
Standalone Exact Image OCR & Display Module
-------------------------------------------
Takes an image as input, processes it using optical character recognition (OCR),
and displays the extracted text word-for-word exactly as it appears in the image.

Requirements Satisfied:
1. Read & Extract: Extracts all visible text from the image word-for-word.
2. Pure Display: Renders and displays the extracted text on screen.
3. No Modification: Zero alteration, formatting, cleanup, summarization, translation,
   or spelling/grammar correction. 100% faithful to the source image.
"""

import os
import sys
import argparse
from typing import Optional

try:
    from PIL import Image
except ImportError:
    Image = None


def extract_exact_text(image_path: str) -> str:
    """
    Extracts all visible text word-for-word from an image file.
    Does NOT alter, format, clean up, translate, or correct spelling/grammar.
    Returns the exact raw text string.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    # 1. First choice: High-speed native Windows OCR (WinOCR)
    try:
        import winocr
        if Image:
            pil_img = Image.open(image_path)
            res = winocr.recognize_pil_sync(pil_img)
            if isinstance(res, dict):
                lines = res.get('lines', [])
                if isinstance(lines, list):
                    line_texts = [
                        str(item['text']) 
                        for item in lines 
                        if isinstance(item, dict) and 'text' in item
                    ]
                    if line_texts:
                        return "\n".join(line_texts)
                raw_val = res.get('text', '')
                return str(raw_val) if raw_val is not None else ""
    except Exception:
        pass

    # 2. Second choice: EasyOCR
    try:
        import easyocr
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        results = reader.readtext(image_path, detail=1)
        raw_lines = [str(item[1]) for item in results if item and len(item) > 1]
        if raw_lines:
            return "\n".join(raw_lines)
    except Exception:
        pass

    # 3. Third choice: RapidOCR (ONNX runtime)
    try:
        from rapidocr_onnxruntime import RapidOCR
        engine = RapidOCR()
        ocr_result, _ = engine(image_path)
        if ocr_result:
            return "\n".join(str(box[1]) for box in ocr_result if len(box) > 1)
    except Exception:
        pass

    # 4. Fallback: PyTesseract (if binary is available)
    try:
        import pytesseract
        pil_img = Image.open(image_path) if Image else image_path
        tess_res = pytesseract.image_to_string(pil_img)
        if isinstance(tess_res, bytes):
            return tess_res.decode('utf-8', errors='ignore')
        return str(tess_res)
    except Exception:
        pass

    raise RuntimeError("No available OCR engine found to process the image.")


def display_in_terminal(text: str, image_path: str) -> None:
    """Renders and displays raw exact text on screen in terminal."""
    border = "=" * 75
    print(border)
    print(f"EXACT RAW OCR OUTPUT FROM: {os.path.basename(image_path)}")
    print(f"Path: {os.path.abspath(image_path)}")
    print(border)
    # Output exact text without any modification
    print(text)
    print(border)


def display_in_gui(text: str, image_path: str) -> None:
    """
    Renders and displays the extracted text on screen in a desktop window (Tkinter).
    """
    try:
        import tkinter as tk
        from tkinter import ttk, scrolledtext

        root = tk.Tk()
        root.title(f"Exact OCR Output — {os.path.basename(image_path)}")
        root.geometry("820x680")
        root.minsize(550, 420)

        # Top Bar
        header_frame = ttk.Frame(root, padding=12)
        header_frame.pack(fill=tk.X)

        title_lbl = ttk.Label(
            header_frame, 
            text=f"Exact Text: {os.path.basename(image_path)}", 
            font=("Segoe UI", 12, "bold")
        )
        title_lbl.pack(anchor=tk.W)

        sub_lbl = ttk.Label(
            header_frame, 
            text="100% Unaltered Raw Text (No summarization, correction, or modification)", 
            font=("Segoe UI", 9, "italic"),
            foreground="#555555"
        )
        sub_lbl.pack(anchor=tk.W, pady=(2, 0))

        # Text View Area
        txt_box = scrolledtext.ScrolledText(
            root, 
            wrap=tk.WORD, 
            font=("Consolas", 11),
            bg="#fbfbfb",
            fg="#1a1a1a",
            padx=12,
            pady=12
        )
        txt_box.pack(expand=True, fill=tk.BOTH, padx=12, pady=6)
        
        # Insert raw extracted text verbatim
        txt_box.insert(tk.END, text)
        txt_box.config(state=tk.DISABLED)  # Read-only

        # Footer Action Area
        btn_frame = ttk.Frame(root, padding=12)
        btn_frame.pack(fill=tk.X)

        status_lbl = ttk.Label(btn_frame, text=f"{len(text.splitlines())} lines detected | {len(text)} characters", foreground="#666666")
        status_lbl.pack(side=tk.LEFT)

        def copy_to_clipboard():
            root.clipboard_clear()
            root.clipboard_append(text)
            status_lbl.config(text="✓ Copied raw text to clipboard!", foreground="#008800")

        copy_btn = ttk.Button(btn_frame, text="Copy Raw Text", command=copy_to_clipboard)
        copy_btn.pack(side=tk.RIGHT, padx=4)

        root.mainloop()
    except Exception as e:
        print(f"[Notice] Could not open GUI window ({e}), rendering in terminal:")
        display_in_terminal(text, image_path)


def main():
    parser = argparse.ArgumentParser(
        description="Extract and display exact visible text from an image without modifications."
    )
    parser.add_argument("image_path", help="Path to input image file (e.g., sample.jpg, report.png)")
    parser.add_argument("--gui", action="store_true", help="Display extracted text in a desktop window")

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)

    args = parser.parse_args()

    # 1. Read & Extract
    raw_text = extract_exact_text(args.image_path)

    # 2. Pure Display
    if args.gui:
        display_in_gui(raw_text, args.image_path)
    else:
        display_in_terminal(raw_text, args.image_path)


if __name__ == "__main__":
    main()
