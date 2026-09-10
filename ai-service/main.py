import os
import json
import argparse

from ocr_service import OCRProcessingService

def main():
    parser = argparse.ArgumentParser(
        description="High-Precision Medical Document Enhancement, OCR & Extraction Pipeline"
    )
    parser.add_argument("file_path", help="Path to the medical document (PDF, PNG, JPG, JPEG, DOCX)")
    parser.add_argument("--confidence", type=float, default=0.65, help="Minimum OCR confidence threshold before retry")
    args = parser.parse_args()

    file_path = args.file_path
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return

    doc_id = os.path.splitext(os.path.basename(file_path))[0]
    
    ocr_service = OCRProcessingService()

    try:
        result = ocr_service.run_pipeline(
            file_path=file_path,
            doc_id=doc_id,
            confidence_threshold=args.confidence
        )

        extracted_tests = result.get("extracted_tests", [])
        overall_status = result.get("overall_status", "UNKNOWN")
        patient_info = result.get("patient_info", {})
        preprocessing_meta = result.get("preprocessing_metadata", {})

        print("\n=======================================================")
        print("EXTRACTION & CLINICAL INTELLIGENCE SUMMARY")
        print("=======================================================")
        print(f"Document ID:      {doc_id}")
        print(f"Patient Name:     {patient_info.get('patient_name')}")
        print(f"Age / Gender:     {patient_info.get('age')} / {patient_info.get('gender')}")
        print(f"Overall Status:   {overall_status}")
        print(f"Tests Extracted:  {len(extracted_tests)}")
        print(f"Enhanced DPI:     {preprocessing_meta.get('dpi_rendered', 300)} DPI")
        print(f"Retry Executed:   {preprocessing_meta.get('retry_executed', False)}")
        print(f"Avg OCR Conf:     {preprocessing_meta.get('ocr_quality', {}).get('average_confidence', 'N/A')}")
        print("=======================================================\n")

        print(f"Results saved to: processed/{doc_id}.json")
        print("Verification command: streamlit run app.py")

    except Exception as err:
        import traceback
        print(f"\nPipeline error during execution: {err}")
        traceback.print_exc()

if __name__ == "__main__":
    main()
