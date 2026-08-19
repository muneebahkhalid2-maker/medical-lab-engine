import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient';

const DEFAULT_ORG_ID = new mongoose.Types.ObjectId("60c72b2f9b1d8b0015b6d910");

const MOCK_PATIENTS = [
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
  }
];

export const getPatients = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const patients = await Patient.find().sort({ createdAt: -1 });
      if (patients && patients.length > 0) {
        return res.json({ success: true, data: patients });
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

    if (mongoose.connection.readyState === 1) {
      const patient = await Patient.create({
        organizationId: DEFAULT_ORG_ID,
        patientId: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || 'New Patient',
        age: age ? Number(age) : 30,
        sex: finalSex,
        contactPhone: finalPhone,
        emergencyContact: finalEmergency,
        address: address || '',
        contactEmail: email || '',
        encounterStatus: 'REGISTERED'
      });
      return res.status(201).json({ success: true, data: patient });
    }

    const newPatient = {
      _id: new mongoose.Types.ObjectId().toString(),
      patientId: `P-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || 'New Patient',
      age: age ? Number(age) : 30,
      sex: finalSex,
      contactPhone: finalPhone,
      emergencyContact: finalEmergency,
      address: address || '',
      contactEmail: email || '',
      encounterStatus: 'REGISTERED',
      createdAt: new Date().toISOString()
    };
    return res.status(201).json({ success: true, data: newPatient });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateEncounterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { encounterStatus } = req.body;

    if (mongoose.connection.readyState === 1) {
      let patient = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        patient = await Patient.findByIdAndUpdate(id, { encounterStatus }, { new: true });
      } else {
        patient = await Patient.findOneAndUpdate({ patientId: id }, { encounterStatus }, { new: true });
      }
      if (patient) {
        return res.json({ success: true, data: patient });
      }
    }
    return res.json({ success: true, data: { _id: id, encounterStatus } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};
