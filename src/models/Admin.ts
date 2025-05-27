import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/environment';

/**
 * Admin interface
 */
export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Admin schema definition
 */
const adminSchema = new Schema<IAdmin>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'super_admin'],
      message: 'Role must be either admin or super_admin'
    },
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Index for faster email lookups
 */
adminSchema.index({ email: 1 });

/**
 * Pre-save middleware to hash password
 */
adminSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with bcrypt
    const saltRounds = config.BCRYPT_SALT_ROUNDS;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Instance method to compare password
 */
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Static method to find admin by email (including password for authentication)
 */
adminSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email }).select('+password');
};

/**
 * Virtual for full admin info (excluding sensitive data)
 */
adminSchema.virtual('publicInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

/**
 * Create and export Admin model
 */
export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
