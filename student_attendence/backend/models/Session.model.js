import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  qrCode: {
    code: {
      type: String,
      required: true,
      unique: true
    },
    imageUrl: {
      type: String
    },
    data: {
      type: String // QR code data (can be JSON stringified)
    }
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  studentsPresent: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    faceVerified: {
      type: Boolean,
      default: false
    },
    faceVerifiedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    }
  }],
  attendanceCount: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ teacher: 1 });
sessionSchema.index({ subject: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ startTime: 1 });
sessionSchema.index({ 'qrCode.code': 1 });

// Virtual for checking if session is active
sessionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startTime && now <= this.endTime;
});

// Method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.endTime;
};

// Method to activate session
sessionSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Method to complete session
sessionSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;



