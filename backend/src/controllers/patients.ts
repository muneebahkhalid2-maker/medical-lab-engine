import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient';

const DEFAULT_ORG_ID = new mongoose.Types.ObjectId("60c72b2f9b1d8b0015b6d910");

const MOCK_PATIENTS: any[] = [
  {
    _id: '60c72b2f9b1d8b0015b6d911',
    patientId: 'P-1001',
    name: 'Eleanor Vance',
    age: 42,
    sex: 'Female',
    contactPhone: '+1 (555) 234-5678',
    emergencyContact: '+1 (555) 999-1111',
    address: '742 Evergreen Terrace, Springfield',
    contactEmail: 'eleanor.vance@example.com',
    encounterStatus: 'VERIFICATION_COMPLETE',
    lastReportDate: '2026-08-12',
    reportsCount: 4,
    riskLevel: 'LOW',
    primaryCondition: 'Routine Checkup / Lipid Panel'
  },
  {
    _id: '60c72b2f9b1d8b0015b6d912',
    patientId: 'P-1002',
    name: 'Marcus Brody',
    age: 58,
    sex: 'Male',
    contactPhone: '+1 (555) 876-5432',
    emergencyContact: '+1 (555) 888-2222',
    address: '123 Baker Street, London',
    contactEmail: 'm.brody@example.com',
    encounterStatus: 'DOCUMENTS_UPLOADED',
    lastReportDate: '2026-08-10',
    reportsCount: 7,
    riskLevel: 'HIGH',
    primaryCondition: 'Elevated Hemoglobin & Glucose'
  },
  {
    _id: '60c72b2f9b1d8b0015b6d913',
    patientId: '145104',
    name: 'M Afzal',
    age: 64,
    sex: 'Male',
    contactPhone: '+92 (300) 555-0199',
    emergencyContact: '+92 (321) 555-0144',
    address: 'NHQ, Lahore Cantonment, Pakistan',
    contactEmail: 'm.afzal@cardiac.org',
    encounterStatus: 'DOCUMENTS_UPLOADED',
    lastReportDate: '2026-08-08',
    reportsCount: 3,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Cardiac & Lipid Evaluation (Army Cardiac Center Lahore)'
  },
  {
    _id: '60c72b2f9b1d8b0015b6d914',
    patientId: 'P-1004',
    name: 'Areeba Shahid',
    age: 24,
    sex: 'Female',
    contactPhone: '+92 (300) 9988776',
    emergencyContact: '+92 (321) 7766554',
    address: 'Rawalpindi Cantonment, Pakistan',
    contactEmail: 'areeba.shahid@example.com',
    encounterStatus: 'VERIFICATION_COMPLETE',
    lastReportDate: '2026-08-31',
    reportsCount: 1,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Lymphocytosis & Microcytic Anemia (AFIP / CMH Report)',
    extractedRecords: [
      { panel: 'Chemical Pathology - LFT', test: 'Total Bilirubin', result: '14', unit: 'umol/L', range: 'Upto 20.5 umol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - LFT', test: 'ALT / SGPT', result: '31', unit: 'U/L', range: 'Adults upto 42 U/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - LFT', test: 'Alkaline Phosphatase (ALP)', result: '221.2', unit: 'U/L', range: '110 - 310 U/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Blood Urea', result: '3.9', unit: 'mmol/L', range: '2.5 - 7.1 mmol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Serum Creatinine', result: '29', unit: 'umol/L', range: '26 - 60 umol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Serum Sodium (Na+)', result: '139', unit: 'mmol/L', range: '135 - 148 mmol/L', status: 'NORMAL' },
      { panel: 'Chemical Pathology - RFT', test: 'Serum Potassium (K+)', result: '4.6', unit: 'mmol/L', range: '3.5 - 5.1 mmol/L', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Urine Colour', result: 'Pale Yellow', unit: 'N/A', range: 'Pale Yellow', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Specific Gravity', result: '1.015', unit: 'N/A', range: '1.005 - 1.030', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Reaction (pH)', result: 'Acidic', unit: 'N/A', range: 'Acidic', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Protein / Albumin', result: 'Nil', unit: 'N/A', range: 'Nil', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Glucose / Sugar', result: 'Nil', unit: 'N/A', range: 'Nil', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Pus Cells / WBC', result: '0 - 2', unit: '/HPF', range: '0 - 5 /HPF', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Red Blood Cells (RBCs)', result: 'Nil', unit: '/HPF', range: '0 - 2 /HPF', status: 'NORMAL' },
      { panel: 'Clinical Pathology - Urine RE', test: 'Epithelial Cells', result: 'Few', unit: '/HPF', range: 'Few /HPF', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Hemoglobin (Hb)', result: '12.4', unit: 'g/dL', range: '12.0 - 14.0 g/dL', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Total Leukocyte Count (TLC)', result: '6.9', unit: 'x10^9/L', range: '4.0 - 11.0 x10^9/L', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Neutrophils', result: '40', unit: '%', range: '40 - 75 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Lymphocytes', result: '52', unit: '%', range: '20 - 45 %', status: 'HIGH' },
      { panel: 'Hematology - CBC', test: 'Eosinophils', result: '05', unit: '%', range: '2 - 10 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Monocytes', result: '03', unit: '%', range: '1 - 6 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Basophils', result: '00', unit: '%', range: '0 - 1 %', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Platelet Count', result: '294', unit: 'x10^9/L', range: '150 - 450 x10^9/L', status: 'NORMAL' },
      { panel: 'Hematology - CBC', test: 'Mean Corpuscular Volume (MCV)', result: '65.8', unit: 'fL', range: '76.0 - 96.0 fL', status: 'LOW' },
      { panel: 'Hematology - CBC', test: 'Hematocrit (PCV)', result: '35.1', unit: '%', range: '36.0 - 46.0 %', status: 'LOW' }
    ]
  }
];

export const getPatients = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const patients = await Patient.find().sort({ createdAt: -1 });
      if (patients && patients.length > 0) {
        // Merge any mock patients that might not be in DB
        const dbIds = new Set(patients.map((p: any) => p.patientId || p._id.toString()));
        const extraMocks = MOCK_PATIENTS.filter(m => !dbIds.has(m.patientId) && !dbIds.has(m._id));
        return res.json({ success: true, data: [...patients, ...extraMocks] });
      }
    }
    return res.json({ success: true, data: MOCK_PATIENTS });
  } catch (error: any) {
    return res.json({ success: true, data: MOCK_PATIENTS });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      let patient = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        patient = await Patient.findById(id);
      } else {
        patient = await Patient.findOne({ patientId: id });
      }
      if (patient) {
        return res.json({ success: true, data: patient });
      }
    }
    const found = MOCK_PATIENTS.find(p => p._id === id || p.patientId === id) || MOCK_PATIENTS[0];
    return res.json({ success: true, data: found });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const { name, age, sex, gender, phone, contactPhone, emergencyContact, emergencyPhone, address, email } = req.body;
    
    const finalSex = sex || gender || 'Unknown';
    const finalPhone = phone || contactPhone || '';
    const finalEmergency = emergencyContact || emergencyPhone || '';
    const generatedPatientId = `P-${Math.floor(1000 + Math.random() * 9000)}`;

    let savedPatient: any = null;

    if (mongoose.connection.readyState === 1) {
      savedPatient = await Patient.create({
        organizationId: DEFAULT_ORG_ID,
        patientId: generatedPatientId,
        name: name || 'New Patient',
        age: age ? Number(age) : 30,
        sex: finalSex,
        contactPhone: finalPhone,
        emergencyContact: finalEmergency,
        address: address || '',
        contactEmail: email || '',
        encounterStatus: 'REGISTERED',
        reportsCount: 0,
        riskLevel: 'LOW',
        primaryCondition: 'New Registration'
      });
      
      const plain = savedPatient.toObject ? savedPatient.toObject() : savedPatient;
      MOCK_PATIENTS.unshift(plain);
      return res.status(201).json({ success: true, data: savedPatient });
    }

    savedPatient = {
      _id: new mongoose.Types.ObjectId().toString(),
      patientId: generatedPatientId,
      name: name || 'New Patient',
      age: age ? Number(age) : 30,
      sex: finalSex,
      gender: finalSex,
      contactPhone: finalPhone,
      phone: finalPhone,
      emergencyContact: finalEmergency,
      address: address || '',
      contactEmail: email || '',
      email: email || '',
      encounterStatus: 'REGISTERED',
      reportsCount: 0,
      riskLevel: 'LOW',
      primaryCondition: 'New Registration',
      createdAt: new Date().toISOString()
    };
    
    MOCK_PATIENTS.unshift(savedPatient);
    return res.status(201).json({ success: true, data: savedPatient });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateEncounterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      encounterStatus, 
      riskLevel, 
      primaryCondition, 
      reportsCount, 
      lastReportDate, 
      latestAnalysis,
      extractedRecords 
    } = req.body;

    const updatePayload: any = {};
    if (encounterStatus) updatePayload.encounterStatus = encounterStatus;
    if (riskLevel) updatePayload.riskLevel = riskLevel;
    if (primaryCondition) updatePayload.primaryCondition = primaryCondition;
    if (reportsCount !== undefined) updatePayload.reportsCount = reportsCount;
    if (lastReportDate) updatePayload.lastReportDate = lastReportDate;
    if (latestAnalysis) updatePayload.latestAnalysis = latestAnalysis;
    if (extractedRecords) updatePayload.extractedRecords = extractedRecords;

    if (mongoose.connection.readyState === 1) {
      let patient = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        patient = await Patient.findByIdAndUpdate(id, updatePayload, { new: true });
      } else {
        patient = await Patient.findOneAndUpdate({ patientId: id }, updatePayload, { new: true });
      }
      if (patient) {
        const plain = patient.toObject ? patient.toObject() : patient;
        const idx = MOCK_PATIENTS.findIndex(p => p._id?.toString() === id || p.patientId === id);
        if (idx !== -1) {
          MOCK_PATIENTS[idx] = { ...MOCK_PATIENTS[idx], ...plain };
        } else {
          MOCK_PATIENTS.unshift(plain);
        }
        return res.json({ success: true, data: patient });
      }
    }

    const idx = MOCK_PATIENTS.findIndex(p => p._id?.toString() === id || p.patientId === id);
    if (idx !== -1) {
      MOCK_PATIENTS[idx] = { ...MOCK_PATIENTS[idx], ...updatePayload };
      return res.json({ success: true, data: MOCK_PATIENTS[idx] });
    }

    return res.json({ success: true, data: { _id: id, ...updatePayload } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};
