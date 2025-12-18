import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  attendanceSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true,
    index: true
  },
  qrScanned: {
    type: Boolean,
    default: false
  },
  faceVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Pending', 'Suspicious'],
    default: 'Pending',
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  qrScannedAt: {
    type: Date
  },
  faceVerifiedAt: {
    type: Date
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate records for same student-session
attendanceRecordSchema.index({ student: 1, attendanceSession: 1 }, { unique: true });

// Indexes
attendanceRecordSchema.index({ student: 1, timestamp: -1 });
attendanceRecordSchema.index({ attendanceSession: 1 });
attendanceRecordSchema.index({ status: 1 });

// Method to update status based on QR scan and face verification
attendanceRecordSchema.methods.updateStatus = function() {
  if (this.qrScanned && this.faceVerified) {
    this.status = 'Present';
  } else if (this.qrScanned && !this.faceVerified) {
    this.status = 'Pending';
  } else if (!this.qrScanned && this.faceVerified) {
    this.status = 'Suspicious';
  } else {
    this.status = 'Pending';
  }
  return this.save();
};

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;



