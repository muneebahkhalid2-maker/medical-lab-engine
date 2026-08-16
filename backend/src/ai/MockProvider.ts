import { AIProvider } from './AIProvider';
import { OCRProvider, OCRBlockResult } from './OCRProvider';
import { ExtractionResponse } from '../validators/extractionSchema';

export class MockProvider implements AIProvider, OCRProvider {
  async extractText(filePath: string, mimeType: string): Promise<OCRBlockResult[]> {
    console.log('[MOCK OCR] Processing', filePath);
    // Simulate OCR processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    return [
      { pageNumber: 1, text: "Hemoglobin 9.2 g/dL 12-16", confidence: 0.99, boundingBox: [120, 350, 620, 395] },
      { pageNumber: 1, text: "WBC 8.5 10^3/uL 4-11", confidence: 0.98, boundingBox: [120, 400, 620, 440] },
      { pageNumber: 1, text: "Platelets 240 10^3/uL 150-450", confidence: 0.97, boundingBox: [120, 450, 620, 490] },
      { pageNumber: 1, text: "MCV 72 fL 80-100", confidence: 0.96, boundingBox: [120, 500, 620, 540] },
    ];
  }

  async extractMedicalData(ocrBlocks: OCRBlockResult[], filePath: string, documentId: string): Promise<ExtractionResponse> {
    console.log('[MOCK AI] Extracting data for', documentId);
    // Simulate LLM time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      documentId,
      tests: [
        {
          testName: "Hemoglobin",
          result: 9.2,
          unit: "g/dL",
          referenceRange: { raw: "12-16", low: 12, high: 16 },
          confidence: 0.97,
          source: { page: 1, text: "Hemoglobin 9.2 g/dL 12-16", boundingBox: [120, 350, 620, 395] }
        },
        {
          testName: "WBC",
          result: 8.5,
          unit: "10^3/uL",
          referenceRange: { raw: "4-11", low: 4, high: 11 },
          confidence: 0.94,
          source: { page: 1, text: "WBC 8.5 10^3/uL 4-11", boundingBox: [120, 400, 620, 440] }
        },
        {
          testName: "Platelets",
          result: 240,
          unit: "10^3/uL",
          referenceRange: { raw: "150-450", low: 150, high: 450 },
          confidence: 0.98,
          source: { page: 1, text: "Platelets 240 10^3/uL 150-450", boundingBox: [120, 450, 620, 490] }
        },
        {
          testName: "MCV",
          result: 72,
          unit: "fL",
          referenceRange: { raw: "80-100", low: 80, high: 100 },
          confidence: 0.95,
          source: { page: 1, text: "MCV 72 fL 80-100", boundingBox: [120, 500, 620, 540] }
        }
      ]
    };
  }
}
