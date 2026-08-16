export interface OCRBlockResult {
  text: string;
  confidence: number;
  boundingBox?: number[];
  pageNumber: number;
}

export interface OCRProvider {
  extractText(filePath: string, mimeType: string): Promise<OCRBlockResult[]>;
}
