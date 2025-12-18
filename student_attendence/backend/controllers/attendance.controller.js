import Attendance from '../models/Attendance.model.js';
import Session from '../models/Session.model.js';
import User from '../models/User.model.js';
import Subject from '../models/Subject.model.js';
import moment from 'moment';

// @desc    Mark attendance after face verification
// @route   POST /api/attendance/mark
// @access  Private (Student)
export const markAttendance = async (req, res) => {
  try {
    const { sessionId, verificationScore } = req.body;
    const studentId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Find session
    const session = await Session.findOne({ sessionId })
      .populate('subject')
      .populate('teacher');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if student scanned QR
    const studentPresent = session.studentsPresent.find(
      sp => sp.student.toString() === studentId.toString()
    );

    if (!studentPresent) {
      return res.status(400).json({
        success: false,
        message: 'Please scan QR code first'
      });
    }

    // Check if already verified
    if (studentPresent.status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked'
      });
    }

    // Check if face verification passed (assuming it did if this endpoint is called)
    const faceVerified = verificationScore !== undefined && verificationScore >= 70;

    if (!faceVerified) {
      studentPresent.status = 'rejected';
      studentPresent.faceVerified = false;
      await session.save();

      return res.status(400).json({
        success: false,
        message: 'Face verification failed. Please try again.',
        verificationScore
      });
    }

    // Update session student present record
    studentPresent.status = 'verified';
    studentPresent.faceVerified = true;
    studentPresent.faceVerifiedAt = new Date();
    await session.save();

    // Create or update attendance record
    let attendance = await Attendance.findOne({
      student: studentId,
      session: session._id
    });

    if (attendance) {
      attendance.status = 'present';
      attendance.faceVerified = true;
      attendance.faceVerifiedAt = new Date();
      attendance.verificationStatus = 'verified';
      attendance.verificationScore = verificationScore || 100;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        student: studentId,
        session: session._id,
        subject: session.subject._id,
        teacher: session.teacher._id,
        date: session.startTime,
        status: 'present',
        qrScanned: true,
        qrScannedAt: studentPresent.scannedAt,
        faceVerified: true,
        faceVerifiedAt: new Date(),
        verificationStatus: 'verified',
        verificationScore: verificationScore || 100,
        markedBy: 'student'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendance: {
          id: attendance._id,
          status: attendance.status,
          date: attendance.date,
          subject: session.subject.name,
          verificationStatus: attendance.verificationStatus,
          verificationScore: attendance.verificationScore
        }
      }
    });
  } catch (error) { console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// @desc    Get student attendance
// @route   GET /api/attendance/student
// @access  Private (Student)
export const getStudentAttendance = async (req, res) => {
  try {
    const { subjectId, startDate, endDate, status } = req.query;
    const studentId = req.user._id;

    const query = { student: studentId };

    if (subjectId) {
      query.subject = subjectId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await Attendance.find(query)
      .populate('subject', 'name code')
      .populate('teacher', 'firstName lastName')
      .populate('session', 'room startTime endTime')
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 100);

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const pending = attendance.filter(a => a.status === 'pending').length;
    const attendancePercentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      count: total,
      statistics: {
        total,
        present,
        absent,
        pending,
        attendancePercentage: parseFloat(attendancePercentage)
      },
      data: { attendance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

// @desc    Get attendance for a session
// @route   GET /api/attendance/session/:sessionId
// @access  Private (Teacher)
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId })
      .populate('subject', 'name code')
      .populate('teacher', 'firstName lastName');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if teacher owns the session
    if (req.user.role === 'teacher' && session.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this session'
      });
    }

    const attendance = await Attendance.find({ session: session._id })
      .populate('student', 'firstName lastName studentId rollNumber batch')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session._id,
          sessionId: session.sessionId,
          subject: session.subject,
          room: session.room,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status
        },
        attendance,
        statistics: {
          total: session.totalStudents,
          present: attendance.filter(a => a.status === 'present').length,
          absent: session.totalStudents - attendance.filter(a => a.status === 'present').length,
          pending: attendance.filter(a => a.status === 'pending').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session attendance',
      error: error.message
    });
  }
};

// @desc    Get all attendance (Teacher/Admin)
// @route   GET /api/attendance
// @access  Private (Teacher/Admin)
export const getAllAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, startDate, endDate, status } = req.query;
    const query = {};

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    if (studentId) {
      query.student = studentId;
    }

    if (subjectId) {
      query.subject = subjectId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId rollNumber')
      .populate('subject', 'name code')
      .populate('teacher', 'firstName lastName')
      .populate('session', 'room startTime')
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: { attendance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

// @desc    Manually mark attendance
// @route   POST /api/attendance/manual
// @access  Private (Teacher/Admin)
export const manualMarkAttendance = async (req, res) => {
  try {
    const { studentId, sessionId, status: attendanceStatus, remarks } = req.body;

    if (!studentId || !sessionId || !attendanceStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, sessionId, and status'
      });
    }

    const session = await Session.findOne({ sessionId })
      .populate('subject')
      .populate('teacher');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if teacher owns the session
    if (session.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to mark attendance for this session'
      });
    }

    // Find or create attendance
    let attendance = await Attendance.findOne({
      student: studentId,
      session: session._id
    });

    if (attendance) {
      attendance.status = attendanceStatus;
      attendance.isManual = true;
      attendance.manualMarkedBy = req.user._id;
      attendance.verificationStatus = 'manual';
      if (remarks) {
        attendance.remarks = remarks;
      }
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        student: studentId,
        session: session._id,
        subject: session.subject._id,
        teacher: session.teacher._id,
        date: session.startTime,
        status: attendanceStatus,
        isManual: true,
        manualMarkedBy: req.user._id,
        verificationStatus: 'manual',
        markedBy: 'teacher',
        remarks
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked manually',
      data: { attendance }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};



