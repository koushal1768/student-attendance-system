import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'pending', 'late'],
    default: 'pending',
    index: true
  },
  qrScanned: {
    type: Boolean,
    default: false
  },
  qrScannedAt: {
    type: Date
  },
  faceVerified: {
    type: Boolean,
    default: false
  },
  faceVerifiedAt: {
    type: Date
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'manual'],
    default: 'pending'
  },
  verificationScore: {
    type: Number, // Face recognition confidence score (0-100)
    min: 0,
    max: 100
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    type: String
  },
  remarks: {
    type: String,
    trim: true
  },
  markedBy: {
    type: String,
    enum: ['student', 'teacher', 'system'],
    default: 'student'
  },
  // Manual override
  isManual: {
    type: Boolean,
    default: false
  },
  manualMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ session: 1 });
attendanceSchema.index({ subject: 1, date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ student: 1, subject: 1, date: -1 });

// Compound unique index to prevent duplicate attendance for same student-session
attendanceSchema.index({ student: 1, session: 1 }, { unique: true });

// Method to mark as verified
attendanceSchema.methods.markVerified = function(score) {
  this.faceVerified = true;
  this.faceVerifiedAt = new Date();
  this.verificationStatus = 'verified';
  this.status = 'present';
  if (score !== undefined) {
    this.verificationScore = score;
  }
  return this.save();
};

// Method to mark as rejected
attendanceSchema.methods.markRejected = function(remarks) {
  this.verificationStatus = 'rejected';
  this.status = 'absent';
  if (remarks) {
    this.remarks = remarks;
  }
  return this.save();
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;



