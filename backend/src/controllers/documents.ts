import { Request, Response } from 'express';
import Document from '../models/Document';
import Extraction from '../models/Extraction';
import OCRBlock from '../models/OCRBlock';
import { MockProvider } from '../ai/MockProvider';
import axios from 'axios';
import path from 'path';

export const uploadDocument = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
  }

  // Get user from auth middleware
  const userId = req.user!.userId;
  // Get org from user
  const User = require('../models/User').default;
  const user = await User.findById(userId);

  if (!user || !user.organizationId) {
    return res.status(400).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } });
  }

  const newDoc = await Document.create({
    organizationId: user.organizationId,
    originalFileName: req.file.originalname,
    storedFileName: req.file.filename,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    storagePath: req.file.path,
    documentType: 'LAB_REPORT',
    uploadStatus: 'UPLOADED',
    uploadedBy: userId,
  });

  res.status(201).json({ success: true, data: newDoc });
};

export const getDocuments = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const User = require('../models/User').default;
  const user = await User.findById(userId);

  if (!user || !user.organizationId) {
    return res.status(400).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } });
  }

  const docs = await Document.find({ organizationId: user.organizationId })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name');

  res.json({ success: true, data: docs });
};

export const getDocument = async (req: Request, res: Response) => {
  const doc = await Document.findById(req.params.id).populate('uploadedBy', 'name');
  if (!doc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
  }
  res.json({ success: true, data: doc });
};

export const processDocument = async (req: Request, res: Response) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
  }

  doc.processingStatus = 'PROCESSING';
  doc.ocrStatus = 'PROCESSING';
  doc.extractionStatus = 'PROCESSING';
  await doc.save();

  // Async task - we don't await this so we don't block the request
  // In a real app this goes to a queue (like BullMQ)
  triggerExtraction(doc._id.toString()).catch(console.error);

  res.json({ success: true, data: doc, message: 'Processing started' });
};

export const getExtractions = async (req: Request, res: Response) => {
  const extractions = await Extraction.find({ documentId: req.params.id });
  res.json({ success: true, data: extractions });
};

const triggerExtraction = async (documentId: string) => {
  const doc = await Document.findById(documentId);
  if (!doc) return;

  try {
    const isMock = process.env.MOCK_AI === 'true';
    let extractionData;

    if (isMock) {
      const mockProvider = new MockProvider();
      const ocrBlocks = await mockProvider.extractText(doc.storagePath, doc.mimeType);
      
      // Save OCR blocks
      for (const block of ocrBlocks) {
        await OCRBlock.create({
          documentId: doc._id,
          pageNumber: block.pageNumber,
          text: block.text,
          confidence: block.confidence,
          boundingBox: block.boundingBox
        });
      }

      extractionData = await mockProvider.extractMedicalData(ocrBlocks, doc.storagePath, doc._id.toString());
    } else {
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/extract`, {
         filepath: doc.storagePath,
         doc_id: doc._id.toString()
      });
      extractionData = response.data; // Ensure this matches ExtractionResponse schema later
    }

    // Save Extracted Fields
    if (extractionData && extractionData.tests) {
      for (const test of extractionData.tests) {
        await Extraction.create({
          documentId: doc._id,
          fieldType: 'LAB_RESULT',
          fieldName: test.testName,
          rawValue: String(test.result),
          normalizedValue: String(test.result),
          confidence: test.confidence,
          sourceText: test.source?.text,
          pageNumber: test.source?.page,
          boundingBox: test.source?.boundingBox,
          aiValue: String(test.result),
          verificationStatus: 'PENDING'
        });
      }
    }

    doc.processingStatus = 'COMPLETED';
    doc.ocrStatus = 'COMPLETED';
    doc.extractionStatus = 'COMPLETED';
    doc.verificationStatus = 'PENDING';
    await doc.save();

  } catch (error: any) {
    console.error(`Extraction failed for ${documentId}:`, error.message);
    doc.processingStatus = 'FAILED';
    doc.errorMessage = error.message;
    await doc.save();
  }
};
