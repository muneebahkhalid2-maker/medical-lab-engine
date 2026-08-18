import mongoose, { Schema, Document } from 'mongoose';

export interface IExtraction extends Document {
  documentId: mongoose.Types.ObjectId;
  fieldType: string;
  fieldName: string;
  
  rawValue: string;
  normalizedValue: string;
  
  confidence: number;
  
  sourceText?: string;
  pageNumber?: number;
  boundingBox?: number[];
  
  aiValue: string;
  correctedValue?: string;
  unit?: string;
  referenceRange?: string;
  
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ExtractionSchema: Schema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    fieldType: { type: String, required: true },
    fieldName: { type: String, required: true },
    
    rawValue: { type: String },
    normalizedValue: { type: String },
    
    confidence: { type: Number, required: true },
    
    sourceText: { type: String },
    pageNumber: { type: Number },
    boundingBox: { type: [Number] },
    
    aiValue: { type: String, required: true },
    correctedValue: { type: String },
    unit: { type: String },
    referenceRange: { type: String },
    
    verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IExtraction>('Extraction', ExtractionSchema);
