import { Request, Response } from 'express';
import Analysis from '../models/Analysis';
import Extraction from '../models/Extraction';
import Document from '../models/Document';
import { StatusEngine } from '../analysis/StatusEngine';

export const analyzeDocument = async (req: Request, res: Response) => {
  const documentId = req.params.documentId;
  const doc = await Document.findById(documentId);

  if (!doc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
  }

  if (doc.verificationStatus !== 'VERIFIED') {
    return res.status(400).json({ success: false, error: { code: 'NOT_VERIFIED', message: 'Document must be verified before analysis' } });
  }

  const extractions = await Extraction.find({ documentId, verificationStatus: 'VERIFIED' });
  const results = [];

  for (const ext of extractions) {
    let low: number | undefined;
    let high: number | undefined;

    // Very naive parsing of the reference range for demonstration.
    // Module A is supposed to provide referenceLow and referenceHigh in the future.
    // Here we'll just extract from raw referenceRange if possible, or assume mock ranges.
    // For MOCK data, the mock provider sets normalizedValue, but let's just parse it if needed.
    
    // In our Mock Provider we didn't save referenceLow into Extraction yet. 
    // Let's hardcode a parsing logic for now or rely on the status engine.
    if (ext.fieldName === 'Hemoglobin') { low = 12; high = 16; }
    if (ext.fieldName === 'WBC') { low = 4; high = 11; }
    if (ext.fieldName === 'Platelets') { low = 150; high = 450; }
    if (ext.fieldName === 'MCV') { low = 80; high = 100; }

    const status = StatusEngine.analyzeResult(ext.correctedValue || ext.aiValue, low, high);

    results.push({
      testName: ext.fieldName,
      result: ext.correctedValue || ext.aiValue,
      unit: undefined, // Module A will provide this later
      referenceLow: low,
      referenceHigh: high,
      status
    });
  }

  const overallStatus = StatusEngine.determineOverallStatus(results);

  // Delete old analysis if exists
  await Analysis.deleteMany({ documentId });

  const analysis = await Analysis.create({
    documentId,
    results,
    overallStatus,
    engineVersion: '1.0.0'
  });

  doc.analysisStatus = 'COMPLETED';
  await doc.save();

  res.json({ success: true, data: analysis });
};

export const getAnalysis = async (req: Request, res: Response) => {
  const analysis = await Analysis.findOne({ documentId: req.params.documentId });
  if (!analysis) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
  }
  res.json({ success: true, data: analysis });
};
