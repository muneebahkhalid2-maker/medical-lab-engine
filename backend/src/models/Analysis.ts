import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysisResult {
  testName: string;
  result: number | string;
  unit?: string;
  referenceLow?: number;
  referenceHigh?: number;
  referenceSource?: string;
  status: 'LOW' | 'NORMAL' | 'HIGH' | 'UNKNOWN' | 'NEEDS_REVIEW';
}

export interface IAnalysis extends Document {
  documentId: mongoose.Types.ObjectId;
  results: IAnalysisResult[];
  overallStatus: 'NORMAL' | 'ABNORMAL' | 'NEEDS_REVIEW' | 'INCOMPLETE';
  analyzedAt: Date;
  engineVersion: string;
}

const AnalysisResultSchema: Schema = new Schema({
  testName: { type: String, required: true },
  result: { type: Schema.Types.Mixed, required: true },
  unit: { type: String },
  referenceLow: { type: Number },
  referenceHigh: { type: Number },
  referenceSource: { type: String },
  status: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'UNKNOWN', 'NEEDS_REVIEW'], required: true }
}, { _id: false });

const AnalysisSchema: Schema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    results: [AnalysisResultSchema],
    overallStatus: { type: String, enum: ['NORMAL', 'ABNORMAL', 'NEEDS_REVIEW', 'INCOMPLETE'], required: true },
    analyzedAt: { type: Date, default: Date.now },
    engineVersion: { type: String, default: '1.0.0' }
  },
  { timestamps: true }
);

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
