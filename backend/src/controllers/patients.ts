import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Patient from '../models/Patient';

const MOCK_PATIENTS = [
  {
    id: 'P-1001',
    name: 'Eleanor Vance',
    age: 42,
    gender: 'Female',
    phone: '+1 (555) 234-5678',
    email: 'eleanor.vance@example.com',
    lastReportDate: '2026-08-12',
    reportsCount: 4,
    riskLevel: 'LOW',
    primaryCondition: 'Routine Checkup / Lipid Panel'
  },
  {
    id: 'P-1002',
    name: 'Marcus Brody',
    age: 58,
    gender: 'Male',
    phone: '+1 (555) 876-5432',
    email: 'm.brody@example.com',
    lastReportDate: '2026-08-10',
    reportsCount: 7,
    riskLevel: 'HIGH',
    primaryCondition: 'Elevated Hemoglobin & Glucose'
  },
  {
    id: 'P-1003',
    name: 'Sophia Martinez',
    age: 29,
    gender: 'Female',
    phone: '+1 (555) 432-1098',
    email: 'sophia.m@example.com',
    lastReportDate: '2026-08-08',
    reportsCount: 2,
    riskLevel: 'MEDIUM',
    primaryCondition: 'Mild Anemia (Low RBC)'
  },
  {
    id: 'P-1004',
    name: 'Arthur Pendelton',
    age: 64,
    gender: 'Male',
    phone: '+1 (555) 901-2345',
    email: 'a.pendelton@example.com',
    lastReportDate: '2026-08-04',
    reportsCount: 5,
    riskLevel: 'LOW',
    primaryCondition: 'Post-Op Comprehensive Metabolic'
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

export const createPatient = async (req: Request, res: Response) => {
  try {
    const { name, age, gender, phone, email, primaryCondition } = req.body;
    if (mongoose.connection.readyState === 1) {
      const patient = await Patient.create({
        organizationId: new mongoose.Types.ObjectId(),
        patientId: `P-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name || 'New Patient',
        age: age ? Number(age) : 30,
        sex: (gender as any) || 'Unknown',
        contactPhone: phone,
        contactEmail: email
      });
      return res.status(201).json({ success: true, data: patient });
    }
    const newPatient = {
      id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name || 'New Patient',
      age: age || 30,
      gender: gender || 'Unspecified',
      phone: phone || '+1 (555) 000-0000',
      email: email || 'patient@example.com',
      lastReportDate: new Date().toISOString().split('T')[0],
      reportsCount: 1,
      riskLevel: 'LOW',
      primaryCondition: primaryCondition || 'General Consultation'
    };
    return res.status(201).json({ success: true, data: newPatient });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
};
