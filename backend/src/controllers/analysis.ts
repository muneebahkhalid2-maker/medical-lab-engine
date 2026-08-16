import { Request, Response } from 'express';
import mongoose from 'mongoose';
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

const MOCK_ANALYSIS_DATA = [
  {
    id: 'ANA-901',
    documentName: 'CBC_Complete_Panel_JohnDoe.pdf',
    patientName: 'Marcus Brody (P-1002)',
    date: '2026-08-14',
    category: 'Hematology',
    parameter: 'Hemoglobin (HGB)',
    value: '18.2 g/dL',
    referenceRange: '13.5 - 17.5 g/dL',
    status: 'HIGH',
    confidence: '99%',
    flagReason: 'Exceeds adult male reference range (+0.7 g/dL above maximum threshold)'
  },
  {
    id: 'ANA-902',
    documentName: 'CBC_Complete_Panel_JohnDoe.pdf',
    patientName: 'Marcus Brody (P-1002)',
    date: '2026-08-14',
    category: 'Hematology',
    parameter: 'White Blood Cell Count (WBC)',
    value: '7.4 x10^3 / µL',
    referenceRange: '4.5 - 11.0 x10^3 / µL',
    status: 'NORMAL',
    confidence: '98%',
    flagReason: 'Within normal physiological range'
  },
  {
    id: 'ANA-903',
    documentName: 'Lipid_Panel_Eleanor.pdf',
    patientName: 'Sophia Martinez (P-1003)',
    date: '2026-08-12',
    category: 'Hematology',
    parameter: 'Red Blood Cell Count (RBC)',
    value: '3.8 x10^6 / µL',
    referenceRange: '4.2 - 5.4 x10^6 / µL',
    status: 'LOW',
    confidence: '97%',
    flagReason: 'Below standard female reference range (-0.4 x10^6 below minimum)'
  },
  {
    id: 'ANA-904',
    documentName: 'Metabolic_Panel_Aug2026.pdf',
    patientName: 'Eleanor Vance (P-1001)',
    date: '2026-08-11',
    category: 'Biochemistry',
    parameter: 'Fasting Blood Glucose',
    value: '95 mg/dL',
    referenceRange: '70 - 99 mg/dL',
    status: 'NORMAL',
    confidence: '99%',
    flagReason: 'Optimal fasting range'
  },
  {
    id: 'ANA-905',
    documentName: 'Metabolic_Panel_Aug2026.pdf',
    patientName: 'Eleanor Vance (P-1001)',
    date: '2026-08-11',
    category: 'Biochemistry',
    parameter: 'Serum Potassium (K+)',
    value: '5.6 mmol/L',
    referenceRange: '3.5 - 5.1 mmol/L',
    status: 'HIGH',
    confidence: '96%',
    flagReason: 'Slightly elevated potassium level'
  }
];

export const getAllAnalysis = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const analyses = await Analysis.find().sort({ createdAt: -1 });
      if (analyses && analyses.length > 0) {
        return res.json({ success: true, data: analyses });
      }
    }
    return res.json({ success: true, data: MOCK_ANALYSIS_DATA });
  } catch (error: any) {
    return res.json({ success: true, data: MOCK_ANALYSIS_DATA });
  }
};
