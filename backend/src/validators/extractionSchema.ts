import { z } from 'zod';

export const extractedFieldSchema = z.object({
  testName: z.string().min(1),
  result: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  referenceRange: z.object({
    raw: z.string().optional(),
    low: z.number().optional(),
    high: z.number().optional()
  }).optional(),
  confidence: z.number().min(0).max(1),
  source: z.object({
    page: z.number().optional(),
    text: z.string().optional(),
    boundingBox: z.array(z.number()).optional() // [x, y, w, h]
  }).optional()
});

export const extractionResponseSchema = z.object({
  documentId: z.string(),
  tests: z.array(extractedFieldSchema)
});

export type ExtractionResponse = z.infer<typeof extractionResponseSchema>;
export type ExtractedField = z.infer<typeof extractedFieldSchema>;
