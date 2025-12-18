import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'], // 'admin' ko HOD ki tarah use karenge
    required: true
  },
  // Ise aisa kar dein (SAHI)
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Yeh 'unique' ko help karta hai jab value null ho
    required: function() {
      // studentId sirf tabhi required hai jab role 'student' ho
      return this.role === 'student';
    }
  },
  // Face recognition - stored as array of numbers (embeddings)
  faceEmbedding: {
    type: [Number],
    default: null
  },
  faceImageUrl: {
    type: String,
    default: null
  },
  isFaceRegistered: {
    type: Boolean,
    default: false
  },
  // HOD verification flags
  isVerified: {
    type: Boolean,
    default: false // Student/Teacher ko HOD verify karega
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ studentId: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
