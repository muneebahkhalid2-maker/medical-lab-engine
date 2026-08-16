import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentPage extends Document {
  documentId: mongoose.Types.ObjectId;
  pageNumber: number;
  imageUrl?: string;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentPageSchema: Schema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    pageNumber: { type: Number, required: true },
    imageUrl: { type: String },
    width: { type: Number },
    height: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model<IDocumentPage>('DocumentPage', DocumentPageSchema);
