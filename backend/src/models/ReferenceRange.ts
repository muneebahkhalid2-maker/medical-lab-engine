import mongoose, { Schema, Document } from 'mongoose';

export interface IReferenceRange extends Document {
  organizationId?: mongoose.Types.ObjectId;
  testName: string;
  unit?: string;
  sex?: 'Male' | 'Female' | 'Any';
  minAge?: number;
  maxAge?: number;
  lowValue: number;
  highValue: number;
  source: string;
}

const ReferenceRangeSchema: Schema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    testName: { type: String, required: true },
    unit: { type: String },
    sex: { type: String, enum: ['Male', 'Female', 'Any'], default: 'Any' },
    minAge: { type: Number },
    maxAge: { type: Number },
    lowValue: { type: Number, required: true },
    highValue: { type: Number, required: true },
    source: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IReferenceRange>('ReferenceRange', ReferenceRangeSchema);
