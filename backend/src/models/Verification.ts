import mongoose, { Schema, Document } from 'mongoose';

export interface IVerification extends Document {
  documentId: mongoose.Types.ObjectId;
  fieldId: mongoose.Types.ObjectId;
  aiValue: string;
  correctedValue: string;
  action: 'CONFIRM' | 'EDIT' | 'REJECT';
  reason?: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const VerificationSchema: Schema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    fieldId: { type: Schema.Types.ObjectId, ref: 'Extraction', required: true },
    aiValue: { type: String, required: true },
    correctedValue: { type: String, required: true },
    action: { type: String, enum: ['CONFIRM', 'EDIT', 'REJECT'], required: true },
    reason: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false } // we define custom timestamp
);

export default mongoose.model<IVerification>('Verification', VerificationSchema);
