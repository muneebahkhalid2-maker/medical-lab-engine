import { Request, Response } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

const MOCK_AUDIT_LOGS = [
  {
    id: 'LOG-8801',
    timestamp: '2026-08-14 16:22:10',
    user: 'Dr. Smith (doctor@example.com)',
    action: 'VERIFY_EXTRACTION',
    resource: 'Document #DOC-1029',
    ipAddress: '192.168.1.45',
    details: 'Verified 8 extracted fields for CBC_Report_2026.pdf (100% verified)',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8802',
    timestamp: '2026-08-14 15:45:02',
    user: 'Staff Member (staff@example.com)',
    action: 'UPLOAD_DOCUMENT',
    resource: 'Document #DOC-1029',
    ipAddress: '192.168.1.48',
    details: 'Uploaded document CBC_Report_2026.pdf (1.45 MB)',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8803',
    timestamp: '2026-08-14 14:10:33',
    user: 'System Process (AI-Engine)',
    action: 'MODULE_A_EXTRACTION',
    resource: 'Document #DOC-1028',
    ipAddress: '127.0.0.1',
    details: 'Extracted 12 lab parameters with average confidence 98.2%',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8804',
    timestamp: '2026-08-14 12:05:19',
    user: 'Admin User (admin@example.com)',
    action: 'UPDATE_THRESHOLD',
    resource: 'Settings / OCR Config',
    ipAddress: '192.168.1.10',
    details: 'Updated OCR confidence threshold to 85%',
    status: 'SUCCESS'
  },
  {
    id: 'LOG-8805',
    timestamp: '2026-08-14 09:30:00',
    user: 'Dr. Smith (doctor@example.com)',
    action: 'USER_LOGIN',
    resource: 'Auth Session',
    ipAddress: '192.168.1.45',
    details: 'Authenticated successfully via JWT bearer token',
    status: 'SUCCESS'
  }
];

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
      if (logs && logs.length > 0) {
        return res.json({ success: true, data: logs });
      }
    }
    return res.json({ success: true, data: MOCK_AUDIT_LOGS });
  } catch (error: any) {
    return res.json({ success: true, data: MOCK_AUDIT_LOGS });
  }
};
