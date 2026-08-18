import { Request, Response } from 'express';
import Extraction from '../models/Extraction';
import Verification from '../models/Verification';
import Document from '../models/Document';
import Analysis, { IAnalysisResult } from '../models/Analysis';
import { StatusEngine } from '../analysis/StatusEngine';

export const updateExtraction = async (req: Request, res: Response) => {
  const { correctedValue } = req.body;
  const extraction = await Extraction.findById(req.params.id);

  if (!extraction) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Extraction not found' } });
  }

  // Create verification log
  await Verification.create({
    documentId: extraction.documentId,
    fieldId: extraction._id,
    aiValue: extraction.aiValue,
    correctedValue: correctedValue,
    action: 'EDIT',
    userId: req.user!.userId
  });

  extraction.correctedValue = correctedValue;
  extraction.verificationStatus = 'VERIFIED';
  extraction.verifiedBy = req.user!.userId as any;
  extraction.verifiedAt = new Date();
  
  await extraction.save();

  res.json({ success: true, data: extraction });
};

export const verifyAllExtractions = async (req: Request, res: Response) => {
  const documentId = req.params.documentId;
  const doc = await Document.findById(documentId);

  if (!doc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
  }

  // Update all unverified extractions
  const extractions = await Extraction.find({ documentId });

  for (const extraction of extractions) {
    if (extraction.verificationStatus === 'PENDING') {
      await Verification.create({
        documentId: documentId,
        fieldId: extraction._id,
        aiValue: extraction.aiValue,
        correctedValue: extraction.correctedValue || extraction.aiValue,
        action: 'CONFIRM',
        userId: req.user!.userId
      });

      extraction.verificationStatus = 'VERIFIED';
      extraction.verifiedBy = req.user!.userId as any;
      extraction.verifiedAt = new Date();
      await extraction.save();
    }
  }

  doc.verificationStatus = 'VERIFIED';
  await doc.save();

  // Hand off to Analysis Engine
  const allExt = await Extraction.find({ documentId });
  const results: IAnalysisResult[] = [];

  for (const ext of allExt) {
    let low: number | undefined;
    let high: number | undefined;
    if (ext.referenceRange) {
      const match = String(ext.referenceRange).match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
      if (match) {
        low = parseFloat(match[1]);
        high = parseFloat(match[2]);
      }
    }
    const valToUse = ext.correctedValue || ext.aiValue || ext.rawValue;
    const status = StatusEngine.analyzeResult(valToUse, low, high);
    results.push({
      testName: ext.fieldName,
      result: valToUse,
      unit: ext.unit,
      referenceLow: low,
      referenceHigh: high,
      status
    });
  }

  if (results.length > 0) {
    const overallStatus = StatusEngine.determineOverallStatus(results);
    await Analysis.deleteMany({ documentId: doc._id });
    await Analysis.create({
      documentId: doc._id,
      results,
      overallStatus,
      engineVersion: '1.0.0'
    });
    doc.analysisStatus = 'COMPLETED';
    await doc.save();
  }

  res.json({ success: true, message: 'All extractions verified and analyzed successfully' });
};
