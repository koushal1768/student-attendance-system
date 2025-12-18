import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const attendanceSessionSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  qrCodeString: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  faceRecognitionActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
attendanceSessionSchema.index({ teacher: 1, date: -1 });
attendanceSessionSchema.index({ isActive: 1, date: -1 });

// Method to check if session is currently active
attendanceSessionSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
};

// Method to deactivate session
attendanceSessionSchema.methods.deactivate = function() {
  this.isActive = false;
  this.faceRecognitionActive = false;
  return this.save();
};

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

export default AttendanceSession;



