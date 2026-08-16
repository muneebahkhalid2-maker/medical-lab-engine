import { ExtractionResponse } from '../validators/extractionSchema';
import { OCRBlockResult } from './OCRProvider';

export interface AIProvider {
  extractMedicalData(ocrBlocks: OCRBlockResult[], filePath: string, documentId: string): Promise<ExtractionResponse>;
}
