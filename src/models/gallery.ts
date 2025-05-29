import mongoose, { Schema } from 'mongoose';

const gallerySchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    image: {
      url: { type: String, required: true },
      publicId: { type: String },
      format: { type: String },
      size: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Gallery', gallerySchema);
