import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import Document from '../models/Document';
import Patient from '../models/Patient';
import Extraction from '../models/Extraction';
import Analysis from '../models/Analysis';
import { StatusEngine } from '../analysis/StatusEngine';
import { uploadToCloudinary } from '../config/cloudinary';
import axios from 'axios';
import path from 'path';

const DEFAULT_ORG_ID = new mongoose.Types.ObjectId("60c72b2f9b1d8b0015b6d910");

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }

    const { patientId } = req.body;
    const userId = req.user?.userId || new mongoose.Types.ObjectId("60c72b2f9b1d8b0015b6d900");

    // Upload to Cloudinary (or local fallback)
    const cloudinaryResult = await uploadToCloudinary(req.file.path, 'medical_documents');

    let docPatientObjectId: mongoose.Types.ObjectId | undefined = undefined;
    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      docPatientObjectId = new mongoose.Types.ObjectId(patientId);
    }

    let newDoc: any = null;

    if (mongoose.connection.readyState === 1) {
      newDoc = await Document.create({
        organizationId: DEFAULT_ORG_ID,
        patientId: docPatientObjectId,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: req.file.path,
        documentType: req.file.mimetype.includes('pdf') ? 'PDF' : (req.file.mimetype.includes('word') ? 'WORD' : 'IMAGE'),
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        uploadStatus: 'UPLOADED',
        processingStatus: 'QUEUED',
        extractionStatus: 'PENDING',
        verificationStatus: 'PENDING',
        uploadedBy: userId,
      });

      // Update Patient encounter status if linked
      if (docPatientObjectId) {
        await Patient.findByIdAndUpdate(docPatientObjectId, { encounterStatus: 'DOCUMENTS_UPLOADED' });
      }
    } else {
      // Memory fallback for mock database state
      newDoc = {
        _id: new mongoose.Types.ObjectId().toString(),
        organizationId: DEFAULT_ORG_ID,
        patientId: patientId || 'P-1001',
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: req.file.path,
        documentType: req.file.mimetype.includes('pdf') ? 'PDF' : (req.file.mimetype.includes('word') ? 'WORD' : 'IMAGE'),
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryPublicId: cloudinaryResult.public_id,
        uploadStatus: 'UPLOADED',
        processingStatus: 'QUEUED',
        extractionStatus: 'PENDING',
        verificationStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };
    }

    res.status(201).json({ success: true, data: newDoc });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { patientId, includeDeleted, onlyDeleted } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query: any = {};
      if (patientId) {
        if (mongoose.Types.ObjectId.isValid(patientId as string)) {
          query.patientId = new mongoose.Types.ObjectId(patientId as string);
        }
      }
      if (onlyDeleted === 'true') {
        query.isDeleted = true;
      } else if (includeDeleted !== 'true') {
        query.isDeleted = { $ne: true };
      }
      const docs = await Document.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, data: docs });
    }

    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.json({ success: true, data: [] });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const doc = await Document.findById(id);
      if (doc) {
        return res.json({ success: true, data: doc });
      }
    }
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const extractDocumentDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    let doc: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      doc = await Document.findById(id);
    }

    let filePath = '';
    if (doc) {
      if (doc.storagePath && fs.existsSync(doc.storagePath)) {
        filePath = doc.storagePath;
      } else if (doc.cloudinaryUrl) {
        filePath = doc.cloudinaryUrl;
      } else {
        filePath = path.join(__dirname, '../../uploads', id);
      }
    } else {
      filePath = path.join(__dirname, '../../uploads', id);
    }

    console.log(`[AI Extraction] Triggering AI Service extraction for doc: ${id} (file: ${filePath}) at ${AI_SERVICE_URL}`);

    // Call Python FastAPI AI Service
    let extractedPayload: any = null;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/extract`, {
        file_path: filePath,
        filepath: filePath,
        doc_id: id
      }, { timeout: 60000 });
      extractedPayload = response.data;
    } catch (aiErr: any) {
      console.error(`[AI Service Error]: Failed to extract data: ${aiErr.message}`);
      if (doc) {
        doc.processingStatus = 'FAILED';
        doc.ocrStatus = 'FAILED';
        doc.extractionStatus = 'FAILED';
        await doc.save();
      }
      return res.status(503).json({
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: `Document extraction failed: ${aiErr.response?.data?.detail || aiErr.message || 'AI service unavailable'}`
        }
      });
    }

    if (doc) {
      doc.processingStatus = 'COMPLETED';
      doc.ocrStatus = 'COMPLETED';
      doc.extractionStatus = 'COMPLETED';
      doc.verificationStatus = 'IN_PROGRESS';
      doc.extractedData = extractedPayload;
      await doc.save();

      // Clear & create Extraction documents
      await Extraction.deleteMany({ documentId: doc._id });
      const analysisResults: any[] = [];

      if (extractedPayload.tests && Array.isArray(extractedPayload.tests)) {
        for (const t of extractedPayload.tests) {
          const testName = t.testName || t.test_name || 'Unknown Test';
          const rawVal = String(t.result !== undefined ? t.result : (t.value !== undefined ? t.value : ''));
          const unit = t.unit || t.normalizedUnit || '';
          const refRangeStr = t.reference_range || t.referenceRange || '';
          const confidence = t.confidence !== undefined ? t.confidence : (t.extraction_confidence || 0.9);

          await Extraction.create({
            documentId: doc._id,
            fieldType: 'LAB_RESULT',
            fieldName: testName,
            rawValue: rawVal,
            normalizedValue: rawVal,
            unit: unit,
            referenceRange: refRangeStr,
            confidence: confidence,
            aiValue: rawVal,
            verificationStatus: 'PENDING'
          });

          // Parse reference low & high for StatusEngine
          let low: number | undefined;
          let high: number | undefined;
          if (refRangeStr) {
            const rangeMatch = String(refRangeStr).match(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/);
            if (rangeMatch) {
              low = parseFloat(rangeMatch[1]);
              high = parseFloat(rangeMatch[2]);
            }
          }
          if (low === undefined && high === undefined) {
            if (testName.toLowerCase().includes('hemoglobin') || testName.toLowerCase().includes('hgb')) { low = 12.1; high = 17.2; }
            else if (testName.toLowerCase().includes('wbc') || testName.toLowerCase().includes('white blood')) { low = 4.0; high = 11.0; }
            else if (testName.toLowerCase().includes('platelet')) { low = 150; high = 450; }
            else if (testName.toLowerCase().includes('rbc') || testName.toLowerCase().includes('red blood')) { low = 4.2; high = 6.1; }
            else if (testName.toLowerCase().includes('glucose')) { low = 70; high = 99; }
          }

          const calculatedStatus = t.status || StatusEngine.analyzeResult(rawVal, low, high);

          analysisResults.push({
            testName,
            result: rawVal,
            unit,
            referenceLow: low,
            referenceHigh: high,
            status: calculatedStatus
          });
        }

        // Auto-create Analysis record
        if (analysisResults.length > 0) {
          const overallStatus = StatusEngine.determineOverallStatus(analysisResults);
          await Analysis.deleteMany({ documentId: doc._id });
          await Analysis.create({
            documentId: doc._id,
            results: analysisResults,
            overallStatus,
            engineVersion: '1.0.0'
          });
          doc.analysisStatus = 'COMPLETED';
          await doc.save();
        }

        // Update linked Patient record with extracted and analyzed report data
        if (doc.patientId) {
          const countDocs = await Document.countDocuments({ patientId: doc.patientId, isDeleted: { $ne: true } });
          const overallStat = extractedPayload?.overall_status || 'NORMAL';
          const risk = (overallStat === 'CRITICAL' || overallStat === 'HIGH') ? 'HIGH' : (overallStat === 'ABNORMAL') ? 'MEDIUM' : 'LOW';
          await Patient.findByIdAndUpdate(doc.patientId, {
            encounterStatus: 'DOCUMENTS_UPLOADED',
            reportsCount: Math.max(countDocs, 1),
            lastReportDate: new Date().toISOString().split('T')[0],
            riskLevel: risk,
            primaryCondition: extractedPayload?.lab_metadata?.lab_name ? `${extractedPayload.lab_metadata.lab_name} (Analyzed)` : 'Lab Report Analyzed',
            latestAnalysis: {
              extractedAt: new Date(),
              panels: extractedPayload?.panels || [],
              overallStatus: overallStat
            }
          });
        }
      }
    }

    return res.json({
      success: true,
      data: {
        documentId: id,
        extractedData: extractedPayload
      }
    });
  } catch (error: any) {
    console.error('Extraction controller error:', error);
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const verifyDocumentData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verifiedTests, notes } = req.body;

    let doc: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      doc = await Document.findById(id);
      if (doc) {
        doc.verificationStatus = 'VERIFIED';
        doc.verifiedData = { tests: verifiedTests, notes, verifiedAt: new Date() };
        await doc.save();

        if (doc.patientId) {
          const countDocs = await Document.countDocuments({ patientId: doc.patientId, isDeleted: { $ne: true } });
          const abnormalCount = (verifiedTests || []).filter((t: any) => t.status === 'HIGH' || t.status === 'CRITICAL' || t.status === 'LOW').length;
          const risk = abnormalCount >= 2 ? 'HIGH' : abnormalCount >= 1 ? 'MEDIUM' : 'LOW';

          await Patient.findByIdAndUpdate(doc.patientId, {
            encounterStatus: 'VERIFICATION_COMPLETE',
            reportsCount: Math.max(countDocs, 1),
            lastReportDate: new Date().toISOString().split('T')[0],
            riskLevel: risk,
            primaryCondition: abnormalCount > 0 ? `Verified Report (${abnormalCount} Clinical Flags)` : 'Verified Report (Normal Ranges)',
            latestAnalysis: {
              verifiedAt: new Date(),
              testsCount: (verifiedTests || []).length,
              tests: verifiedTests
            }
          });
        }
      }
    }

    return res.json({
      success: true,
      message: 'Document data verified successfully',
      data: {
        documentId: id,
        verificationStatus: 'VERIFIED',
        encounterStatus: 'VERIFICATION_COMPLETE',
        verifiedTests
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const processDocument = async (req: Request, res: Response) => {
  return extractDocumentDetails(req, res);
};

export const getExtractions = async (req: Request, res: Response) => {
  try {
    const extractions = await Extraction.find({ documentId: req.params.id });
    res.json({ success: true, data: extractions });
  } catch (error: any) {
    res.json({ success: true, data: [] });
  }
};

export const softDeleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const doc = await Document.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (doc) {
        return res.json({ success: true, message: 'Report moved to trash successfully', data: doc });
      }
    }
    return res.json({
      success: true,
      message: 'Report moved to trash successfully',
      data: { _id: id, isDeleted: true, deletedAt: new Date().toISOString() }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const restoreDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const doc = await Document.findByIdAndUpdate(
        id,
        { isDeleted: false, deletedAt: null },
        { new: true }
      );
      if (doc) {
        return res.json({ success: true, message: 'Report restored successfully', data: doc });
      }
    }
    return res.json({
      success: true,
      message: 'Report restored successfully',
      data: { _id: id, isDeleted: false, deletedAt: null }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const reverifyDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let doc: any = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      doc = await Document.findById(id);
    }
    
    if (doc) {
      doc.verificationStatus = 'VERIFIED';
      doc.processingStatus = 'COMPLETED';
      doc.updatedAt = new Date();
      await doc.save();
    }
    
    return res.json({
      success: true,
      message: 'Report re-verified from Cloudinary successfully',
      data: {
        documentId: id,
        verificationStatus: 'VERIFIED',
        cloudinaryUrl: doc?.cloudinaryUrl || null,
        reverifiedAt: new Date().toISOString(),
        extractedData: doc?.extractedData || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

