import mongoose, { Schema, Document as MongooseDocument } from 'mongoose';

export interface IDoc extends MongooseDocument {
  organizationId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  documentType: string;
  pageCount: number;
  
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;

  extractedData?: any;
  verifiedData?: any;

  processingStatus: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  uploadStatus: 'UPLOADING' | 'UPLOADED' | 'FAILED';
  ocrStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractionStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  verificationStatus: 'NOT_REQUIRED' | 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
  analysisStatus: 'PENDING' | 'COMPLETED' | 'FAILED';

  uploadedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    storagePath: { type: String, required: true },
    documentType: { type: String, default: 'UNKNOWN' },
    pageCount: { type: Number, default: 1 },

    cloudinaryUrl: { type: String },
    cloudinaryPublicId: { type: String },
    extractedData: { type: Schema.Types.Mixed },
    verifiedData: { type: Schema.Types.Mixed },
    
    processingStatus: { type: String, enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'QUEUED' },
    uploadStatus: { type: String, enum: ['UPLOADING', 'UPLOADED', 'FAILED'], default: 'UPLOADED' },
    ocrStatus: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    extractionStatus: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
    verificationStatus: { type: String, enum: ['NOT_REQUIRED', 'PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    analysisStatus: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    
    errorMessage: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IDoc>('Document', DocumentSchema);
