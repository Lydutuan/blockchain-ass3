import mongoose, { Schema } from 'mongoose';

const FileSchema = new Schema({
  originalName: { type: String, required: true },
  ipfsCid: { type: String, required: true, index: true },
  size: { type: Number },
  encrypted: { type: Boolean, default: false },
  encryption: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

const FileModel = mongoose.model('File', FileSchema);
export default FileModel;
