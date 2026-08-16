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
    contactPhone: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);
