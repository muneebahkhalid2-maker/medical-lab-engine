import { Request, Response } from 'express';
import Extraction from '../models/Extraction';
import Verification from '../models/Verification';
import Document from '../models/Document';

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
  const extractions = await Extraction.find({ documentId, verificationStatus: 'PENDING' });

  for (const extraction of extractions) {
    await Verification.create({
      documentId: documentId,
      fieldId: extraction._id,
      aiValue: extraction.aiValue,
      correctedValue: extraction.aiValue, // Confirmed as is
      action: 'CONFIRM',
      userId: req.user!.userId
    });

    extraction.verificationStatus = 'VERIFIED';
    extraction.verifiedBy = req.user!.userId as any;
    extraction.verifiedAt = new Date();
    await extraction.save();
  }

  doc.verificationStatus = 'VERIFIED';
  await doc.save();

  // Hand off to Module B (Analysis)
  // triggerAnalysis(documentId)
  
  res.json({ success: true, message: 'All extractions verified successfully' });
};
