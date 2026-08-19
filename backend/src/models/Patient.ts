import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IPatient extends MongooseDocument {
  organizationId: mongoose.Types.ObjectId;
  patientId: string;
  name: string;
  dateOfBirth?: Date;
  age?: number;
  sex?: 'Male' | 'Female' | 'Other' | 'Unknown';
  contactEmail?: string;
  contactPhone?: string;
  emergencyContact?: string;
  address?: string;
  encounterStatus: 'REGISTERED' | 'DOCUMENTS_UPLOADED' | 'VERIFICATION_COMPLETE';
  reportsCount?: number;
  lastReportDate?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryCondition?: string;
  latestAnalysis?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    patientId: { type: String, required: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    sex: { type: String, enum: ['Male', 'Female', 'Other', 'Unknown'], default: 'Unknown' },
    contactEmail: { type: String },
    contactPhone: { type: String },
    emergencyContact: { type: String },
    address: { type: String },
    encounterStatus: { 
      type: String, 
      enum: ['REGISTERED', 'DOCUMENTS_UPLOADED', 'VERIFICATION_COMPLETE'], 
      default: 'REGISTERED' 
    },
    reportsCount: { type: Number, default: 0 },
    lastReportDate: { type: String },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    primaryCondition: { type: String },
    latestAnalysis: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);
