import AttendanceSession from '../models/AttendanceSession.model.js';
import { generateSessionQR } from '../utils/generateQR.js';
import axios from 'axios';

// @desc    Create a new attendance session
// @route   POST /api/sessions
// @access  Private (Teacher)
export const createSession = async (req, res) => {
  try {
    const { subject, date, startTime, endTime } = req.body;
    const teacherId = req.user._id;

    if (!subject || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, date, startTime, and endTime'
      });
    }

    // Generate unique QR code string
    const qrData = await generateSessionQR({
      teacherId: teacherId.toString(),
      subject,
      date,
      startTime,
      endTime
    });

    // Create session
    const session = await AttendanceSession.create({
      teacher: teacherId,
      subject,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      qrCodeString: qrData.qrCode,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: {
        session: {
          id: session._id,
          teacher: session.teacher,
          subject: session.subject,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          qrCodeString: session.qrCodeString,
          isActive: session.isActive
        },
        qrCode: {
          string: qrData.qrCode,
          image: qrData.qrImage,
          data: qrData.qrData
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message
    });
  }
};

// @desc    Get all sessions for the teacher
// @route   GET /api/sessions
// @access  Private (Teacher)
export const getSessions = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const sessions = await AttendanceSession.find({ teacher: teacherId })
      .sort({ date: -1, startTime: -1 })
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

// @desc    Get a specific session
// @route   GET /api/sessions/:id
// @access  Private (Teacher)
export const getSessionById = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

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
        message: 'You do not have permission to view this session'
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

// @desc    Update a session (e.g., deactivate)
// @route   PUT /api/sessions/:id
// @access  Private (Teacher)
export const updateSession = async (req, res) => {
  try {
    const { isActive } = req.body;

    const session = await AttendanceSession.findById(req.params.id);

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
        message: 'You do not have permission to update this session'
      });
    }

    if (isActive !== undefined) {
      session.isActive = isActive;
      // If deactivating, also stop face recognition
      if (!isActive) {
        session.faceRecognitionActive = false;
        // Stop face recognition in AI service
        try {
          await axios.post(`${process.env.AI_SERVICE_URL}/stop-session`, {
            sessionId: session._id.toString()
          });
        } catch (error) {
          console.error('Failed to stop face recognition:', error.message);
        }
      }
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private (Teacher)
export const deleteSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

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
        message: 'You do not have permission to delete this session'
      });
    }

    // Stop face recognition if active
    if (session.faceRecognitionActive) {
      try {
        await axios.post(`${process.env.AI_SERVICE_URL}/stop-session`, {
          sessionId: session._id.toString()
        });
      } catch (error) {
        console.error('Failed to stop face recognition:', error.message);
      }
    }

    await session.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message
    });
  }
};

// @desc    Start face recognition for a session
// @route   POST /api/sessions/:id/start-face-recognition
// @access  Private (Teacher)
export const startFaceRecognition = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id)
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
        message: 'You do not have permission to start face recognition for this session'
      });
    }

    // Get all students for the session (you may need to fetch from subject enrollment)
    // For now, we'll get all students - you can filter by subject later
    const User = (await import('../models/User.model.js')).default;
    const students = await User.find({
      role: 'student',
      isActive: true,
      isFaceRegistered: true,
      faceEmbedding: { $ne: null }
    }).select('_id studentId name faceEmbedding');

    // Send to AI service
    try {
      await axios.post(`${process.env.AI_SERVICE_URL}/start-session`, {
        sessionId: session._id.toString(),
        students: students.map(s => ({
          studentId: s._id.toString(),
          faceEmbedding: s.faceEmbedding,
          name: s.name
        }))
      });

      session.faceRecognitionActive = true;
      await session.save();

      res.status(200).json({
        success: true,
        message: 'Face recognition started successfully',
        data: { session }
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'Failed to start face recognition',
        error: error.response?.data?.message || error.message
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to start face recognition',
      error: error.message
    });
  }
};

// @desc    Stop face recognition for a session
// @route   POST /api/sessions/:id/stop-face-recognition
// @access  Private (Teacher)
export const stopFaceRecognition = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.id);

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
        message: 'You do not have permission to stop face recognition for this session'
      });
    }

    // Stop face recognition in AI service
    try {
      await axios.post(`${process.env.AI_SERVICE_URL}/stop-session`, {
        sessionId: session._id.toString()
      });
    } catch (error) {
      console.error('Failed to stop face recognition:', error.message);
    }

    session.faceRecognitionActive = false;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Face recognition stopped successfully',
      data: { session }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop face recognition',
      error: error.message
    });
  }
};

// @desc    Get students for a session (for AI service)
// @route   GET /api/sessions/:sessionId/students
// @access  Private (AI Service only - uses special token)
export const getSessionStudents = async (req, res) => {
  try {
    // Verify AI service token
    if (req.headers['x-ai-service-token'] !== process.env.AI_SERVICE_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const User = (await import('../models/User.model.js')).default;
    const students = await User.find({
      role: 'student',
      isActive: true,
      isFaceRegistered: true,
      faceEmbedding: { $ne: null }
    }).select('_id studentId name faceEmbedding');

    res.status(200).json({
      success: true,
      data: {
        students: students.map(s => ({
          studentId: s._id.toString(),
          faceEmbedding: s.faceEmbedding,
          name: s.name,
          studentIdNumber: s.studentId
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};



