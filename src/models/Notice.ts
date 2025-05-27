import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * File attachment interface
 */
interface IAttachment {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}

/**
 * Notice interface
 */
export interface INotice extends Document {
  title: string;
  description: string;
  date: Date;
  attachment?: IAttachment;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Attachment schema
 */
const attachmentSchema = new Schema<IAttachment>({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * Notice schema definition
 */
const noticeSchema = new Schema<INotice>({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Notice description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Notice date is required'],
    default: Date.now
  },
  attachment: {
    type: attachmentSchema,
    required: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Creator admin ID is required']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Updater admin ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Indexes for better query performance
 */
noticeSchema.index({ date: -1 });
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ isActive: 1 });
noticeSchema.index({ title: 'text', description: 'text' }); // Text search index

/**
 * Virtual for attachment URL (if needed for serving files)
 */
noticeSchema.virtual('attachmentUrl').get(function() {
  if (this.attachment) {
    return `/uploads/${this.attachment.filename}`;
  }
  return null;
});

/**
 * Virtual for formatted date
 */
noticeSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

/**
 * Virtual for attachment file extension
 */
noticeSchema.virtual('attachmentExtension').get(function() {
  if (this.attachment) {
    return this.attachment.filename.split('.').pop()?.toLowerCase();
  }
  return null;
});

/**
 * Virtual for attachment type (image, pdf, etc.)
 */
noticeSchema.virtual('attachmentType').get(function() {
  if (this.attachment) {
    if (this.attachment.mimeType.startsWith('image/')) return 'image';
    if (this.attachment.mimeType === 'application/pdf') return 'pdf';
    return 'document';
  }
  return null;
});

/**
 * Static method to find active notices
 */
noticeSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

/**
 * Static method to search notices by text
 */
noticeSchema.statics.searchByText = function(searchText: string) {
  return this.find({
    $text: { $search: searchText },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

/**
 * Instance method to deactivate notice
 */
noticeSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

/**
 * Instance method to activate notice
 */
noticeSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

/**
 * Pre-save middleware for date validation
 */
noticeSchema.pre('save', function(next) {
  // Ensure date is not in the future (optional business rule)
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

  if (this.date > maxFutureDate) {
    const error = new Error('Notice date cannot be more than 30 days in the future');
    return next(error);
  }

  next();
});

/**
 * Create and export Notice model
 */
export const Notice = mongoose.model<INotice>('Notice', noticeSchema);
