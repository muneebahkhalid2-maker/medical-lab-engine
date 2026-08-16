import os
import mimetypes

class DocumentIngestion:
    def __init__(self, file_path: str):
        self.file_path = file_path

    def get_metadata(self) -> dict:
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"File not found: {self.file_path}")

        file_size = os.path.getsize(self.file_path)
        mime_type, _ = mimetypes.guess_type(self.file_path)
        
        # Determine basic format
        if mime_type:
            if mime_type.startswith('image/'):
                doc_format = "image"
            elif mime_type == 'application/pdf':
                doc_format = "pdf"
            elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                doc_format = "docx"
            else:
                doc_format = "unknown"
        else:
            doc_format = "unknown"

        # Determine number of pages (simplified for now)
        num_pages = 1
        if doc_format == "pdf":
            # We will rely on PDF parsing later, but for now we default to unknown
            pass 

        metadata = {
            "file_type": mime_type,
            "file_size": file_size,
            "number_of_pages": num_pages,
            "document_format": doc_format,
            "document_type": self._determine_document_type(self.file_path)
        }
        return metadata

    def _determine_document_type(self, file_path: str) -> str:
        # Step 2: Determine document type.
        # For the first version, we focus only on laboratory reports.
        return "laboratory_report"

if __name__ == "__main__":
    pass
