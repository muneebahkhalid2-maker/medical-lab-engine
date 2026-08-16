import mongoose, { Schema, Document } from 'mongoose';

export interface IOCRBlock extends Document {
  documentId: mongoose.Types.ObjectId;
  pageId?: mongoose.Types.ObjectId;
  pageNumber: number;
  text: string;
  confidence: number;
  boundingBox: number[]; // [x, y, w, h] or similar
  createdAt: Date;
  updatedAt: Date;
}

const OCRBlockSchema: Schema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    pageId: { type: Schema.Types.ObjectId, ref: 'DocumentPage' },
    pageNumber: { type: Number, required: true },
    text: { type: String, required: true },
    confidence: { type: Number, required: true },
    boundingBox: { type: [Number] }
  },
  { timestamps: true }
);

export default mongoose.model<IOCRBlock>('OCRBlock', OCRBlockSchema);
