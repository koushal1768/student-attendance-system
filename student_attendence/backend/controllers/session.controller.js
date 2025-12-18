import Session from '../models/Session.model.js';
import Subject from '../models/Subject.model.js';
import User from '../models/User.model.js';
import { generateSessionQR, verifyQRCode } from '../utils/generateQR.js';
import moment from 'moment';

// @desc    Generate QR code for session
// @route   POST /api/sessions/generate
// @access  Private (Teacher)
export const generateSession = async (req, res) => {
  try {
    const { subjectId, room, duration } = req.body;
    const teacherId = req.user._id;

    if (!subjectId || !room) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectId and room'
      });
    }

    // Get subject details
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if teacher owns the subject
    if (subject.teacher.toString() !== teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create sessions for this subject'
      });
    }

    const sessionDuration = parseInt(duration) || 60; // Default 60 minutes
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000);

    // Generate QR code
    const qrData = await generateSessionQR({
      teacherId: teacherId.toString(),
      subjectId: subjectId.toString(),
      subject: subject.name,
      room,
      expiry: endTime.toISOString()
    });

    // Create session
    const session = await Session.create({
      sessionId: qrData.sessionId,
      teacher: teacherId,
      subject: subjectId,
      room,
      startTime,
      endTime,
      duration: sessionDuration,
      qrCode: {
        code: qrData.qrCode,
        data: qrData.qrData,
        imageUrl: qrData.qrImage // Store as data URL for now
      },
      status: 'active',
      totalStudents: subject.enrolledStudents?.length || 0
    });

    // Update subject total sessions
    subject.totalSessions += 1;
    await subject.save();

    res.status(201).json({
      success: true,
      message: 'Session created and QR code generated successfully',
      data: {
        session: {
          id: session._id,
          sessionId: session.sessionId,
          subject: {
            id: subject._id,
            name: subject.name,
            code: subject.code
          },
          room: session.room,
          duration: session.duration,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          totalStudents: session.totalStudents,
          attendanceCount: session.attendanceCount
        },
        qrCode: {
          code: qrData.qrCode,
          image: qrData.qrImage,
          data: qrData.qrData
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate session',
      error: error.message
    });
  }
};

// @desc    Get all sessions
// @route   GET /api/sessions
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const { status, subjectId, startDate, endDate } = req.query;
    const query = {};

    // Filter by role
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      // Students can only see sessions they're enrolled in
      // This would require checking enrolled students in subjects
    }

    if (status) {
      query.status = status;
    }

    if (subjectId) {
      query.subject = subjectId;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) {
        query.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate);
      }
    }

    const sessions = await Session.find(query)
      .populate('teacher', 'firstName lastName teacherId')
      .populate('subject', 'name code')
      .populate('studentsPresent.student', 'firstName lastName studentId')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: { sessions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions',
      error: error.message
    });
  }
};

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
export const getSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teacher', 'firstName lastName teacherId')
      .populate('subject', 'name code')
      .populate('studentsPresent.student', 'firstName lastName studentId rollNumber');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session',
      error: error.message
    });
  }
};

// @desc    Scan QR code
// @route   POST /api/sessions/scan
// @access  Private (Student)
export const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    const studentId = req.user._id;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    // Verify QR code
    const verification = verifyQRCode(qrData);
    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.reason || 'Invalid QR code'
      });
    }

    const { sessionId } = verification.data;

    // Find session by sessionId
    let session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Check if session expired
    if (session.isExpired()) {
      session.status = 'completed';
      await session.save();
      return res.status(400).json({
        success: false,
        message: 'Session has expired'
      });
    }

    // Check if student already scanned
    const existingScan = session.studentsPresent.find(
      sp => sp.student.toString() === studentId.toString()
    );

    if (existingScan) {
      return res.status(400).json({
        success: false,
        message: 'You have already scanned this QR code',
        data: {
          scannedAt: existingScan.scannedAt,
          status: existingScan.status
        }
      });
    }

    // Add student to studentsPresent
    session.studentsPresent.push({
      student: studentId,
      scannedAt: new Date(),
      status: 'pending'
    });

    session.attendanceCount = session.studentsPresent.length;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'QR code scanned successfully. Awaiting face verification.',
      data: {
        session: {
          id: session._id,
          sessionId: session.sessionId,
          subject: session.subject,
          room: session.room
        },
        status: 'pending',
        scannedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to scan QR code',
      error: error.message
    });
  }
};

// @desc    Complete session
// @route   PUT /api/sessions/:id/complete
// @access  Private (Teacher)
export const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if teacher owns the session
    if (session.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to complete this session'
      });
    }

    session.status = 'completed';
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session completed successfully',
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete session',
      error: error.message
    });
  }
};

// @desc    Get active sessions
// @route   GET /api/sessions/active
// @access  Private
export const getActiveSessions = async (req, res) => {
  try {
    const query = {
      status: 'active',
      endTime: { $gte: new Date() }
    };

    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    const sessions = await Session.find(query)
      .populate('teacher', 'firstName lastName')
      .populate('subject', 'name code')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: { sessions }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: error.message
    });
  }
};



