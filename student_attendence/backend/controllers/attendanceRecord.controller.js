import mongoose from 'mongoose';
import AttendanceRecord from '../models/AttendanceRecord.model.js';
import AttendanceSession from '../models/AttendanceSession.model.js';
import User from '../models/User.model.js';
import axios from 'axios';

// @desc    Scan QR code and mark attendance attempt
// @route   POST /api/attendance/qr-scan
// @access  Private (Student)
// export const scanQR = async (req, res) => {
//   try {
//     const { qrCodeString } = req.body;
//     const studentId = req.user._id;

//     if (!qrCodeString) {
//       return res.status(400).json({
//         success: false,
//         message: 'QR code string is required'
//       });
//     }

//     // Find session by QR code string
//     const session = await AttendanceSession.findOne({
//       qrCodeString,
//       isActive: true
//     });

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Invalid QR code or session not found'
//       });
//     }

//     // Check if session is currently active
//     if (!session.isCurrentlyActive()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Session is not currently active'
//       });
//     }

//     // Find or create attendance record (upsert)
//     let attendanceRecord = await AttendanceRecord.findOne({
//       student: studentId,
//       attendanceSession: session._id
//     });

//     if (attendanceRecord) {
//       // If record exists, update QR scan
//       if (attendanceRecord.qrScanned) {
//         return res.status(400).json({
//           success: false,
//           message: 'QR code already scanned for this session',
//           data: { attendanceRecord }
//         });
//       }

//       attendanceRecord.qrScanned = true;
//       attendanceRecord.qrScannedAt = new Date();
      
//       // If face was already verified, mark as Present
//       if (attendanceRecord.faceVerified) {
//         attendanceRecord.status = 'Present';
//       } else {
//         attendanceRecord.status = 'Pending';
//       }
      
//       await attendanceRecord.updateStatus();
//     } else {
//       // Create new record
//       attendanceRecord = await AttendanceRecord.create({
//         student: studentId,
//         attendanceSession: session._id,
//         qrScanned: true,
//         qrScannedAt: new Date(),
//         status: 'Pending'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'QR code scanned successfully',
//       data: {
//         attendanceRecord,
//         message: attendanceRecord.status === 'Present' 
//           ? 'Attendance marked as Present (QR + Face verified)' 
//           : 'QR scanned. Waiting for face verification.'
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to scan QR code',
//       error: error.message
//     });
//   }
// };
//  or
// //single attendence system
// export const scanQR = async (req, res) => {
//   try {
//     const { qrCodeString } = req.body;
//     const studentId = req.user._id; // Student jo login hai (Token se)

//     if (!qrCodeString) {
//       return res.status(400).json({ success: false, message: 'QR code string is required' });
//     }

//     // 1. Session dhoondhein
//     const session = await AttendanceSession.findOne({
//       qrCodeString: qrCodeString,
//       status: 'Active'
//     });

//     if (!session) {
//       return res.status(404).json({ success: false, message: 'Invalid or expired QR code' });
//     }
    
//     // 2. Student ka data (embedding) database se nikalein
//     const student = await User.findById(studentId);
//     if (!student || !student.isFaceRegistered || !student.faceEmbedding) {
//       return res.status(400).json({ success: false, message: 'Your face is not registered. Please contact your teacher.' });
//     }

//     // --- YEH HAI NAYA LOGIC ---

//     // 3. Python AI server ko call karke chehra verify karein
//     let faceVerified = false;
//     try {
//       const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/verify-single-face`, {
//         faceEmbedding: student.faceEmbedding
//       });
      
//       if (aiResponse.data.success && aiResponse.data.match_found) {
//         faceVerified = true;
//       }
//     } catch (aiError) {
//       console.error("AI service /verify-single-face error:", aiError.message);
//       // Agar AI server band hai, tab bhi hum 'Pending' mein daal denge
//     }

//     // --- NAYA LOGIC KHATAM ---

//     // 4. Attendance record banayein ya update karein
//     const status = faceVerified ? 'Present' : 'Pending'; // Ya 'Suspicious'
    
//     const attendanceRecord = await AttendanceRecord.findOneAndUpdate(
//       { student: studentId, attendanceSession: session._id },
//       { 
//         status: status,
//         qrScanned: true,
//         faceVerified: faceVerified,
//         scanTime: new Date()
//       },
//       { new: true, upsert: true } // 'new: true' naya record return karta hai, 'upsert: true' agar record na ho toh bana deta hai
//     );

//     res.status(200).json({
//       success: true,
//       message: `Attendance marked as ${status}`,
//       data: { attendanceRecord }
//     });

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server error during QR scan',
//       error: error.message
//     });
//   }
// };



export const scanQR = async (req, res) => {
  try {
    const { qrCodeString } = req.body;
    const studentId = req.user._id; // Student jo login hai (Token se)

    if (!qrCodeString) {
      return res.status(400).json({ success: false, message: 'QR code string is required' });
    }

    // 1. Session dhoondhein (Aapke doosre code se liya gaya SAHI LOGIC)
    const session = await AttendanceSession.findOne({
      qrCodeString: qrCodeString,
      isActive: true // <-- YEH SAHI FIELD HAI
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid or expired QR code' });
    }
    
    // (Optional) Yeh check bhi aapke doosre code se achha hai
    if (session.isCurrentlyActive && !session.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        message: 'Session is not currently active (e.g., outside time limit)'
      });
    }
    
    // 2. Student ka data (embedding) database se nikalein
    const student = await User.findById(studentId);
    if (!student || !student.isFaceRegistered || !student.faceEmbedding) {
      return res.status(400).json({ success: false, message: 'Your face is not registered. Please contact your teacher.' });
    }

    // 3. Python AI server ko call karke chehra verify karein
    let faceVerified = false;
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/verify-single-face`, {
        faceEmbedding: student.faceEmbedding
      });
      
      if (aiResponse.data.success && aiResponse.data.match_found) {
        faceVerified = true;
      }
    } catch (aiError) {
      console.error("AI service /verify-single-face error:", aiError.message);
      // Agar AI server band hai, tab bhi hum 'Pending' mein daal denge
    }

    // 4. Attendance record banayein ya update karein
    const status = faceVerified ? 'Present' : 'Pending';
    
    const attendanceRecord = await AttendanceRecord.findOneAndUpdate(
      { student: studentId, attendanceSession: session._id },
      { 
        status: status,
        qrScanned: true,
        faceVerified: faceVerified,
        scanTime: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status}`,
      data: { attendanceRecord }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during QR scan',
      error: error.message
    });
  }
};

// @desc    Face verification (called by AI service)
// @route   POST /api/attendance/face-verify
// @access  Private (AI Service)
export const faceVerify = async (req, res) => {
  try {
    // Verify AI service token
    if (req.headers['x-ai-service-token'] !== process.env.AI_SERVICE_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { sessionId, studentId, confidence } = req.body;

    if (!sessionId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and Student ID are required'
      });
    }

    // Verify session exists and is active
    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not active'
      });
    }

    // Find or create attendance record (upsert)
    let attendanceRecord = await AttendanceRecord.findOne({
      student: studentId,
      attendanceSession: sessionId
    });

    if (attendanceRecord) {
      // If record exists, update face verification
      if (attendanceRecord.faceVerified) {
        return res.status(400).json({
          success: false,
          message: 'Face already verified for this session',
          data: { attendanceRecord }
        });
      }

      attendanceRecord.faceVerified = true;
      attendanceRecord.faceVerifiedAt = new Date();
      attendanceRecord.confidence = confidence || 100;
      
      // If QR was already scanned, mark as Present
      if (attendanceRecord.qrScanned) {
        attendanceRecord.status = 'Present';
      } else {
        attendanceRecord.status = 'Suspicious';
      }
      
      await attendanceRecord.updateStatus();
    } else {
      // Create new record with face verified but no QR scan
      attendanceRecord = await AttendanceRecord.create({
        student: studentId,
        attendanceSession: sessionId,
        faceVerified: true,
        faceVerifiedAt: new Date(),
        confidence: confidence || 100,
        status: 'Suspicious'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Face verified successfully',
      data: {
        attendanceRecord,
        message: attendanceRecord.status === 'Present'
          ? 'Attendance marked as Present (QR + Face verified)'
          : 'Face verified. Waiting for QR scan.'
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify face',
      error: error.message
    });
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance/records
// @access  Private (Teacher)
export const getAttendanceRecords = async (req, res) => {
  try {
    const { sessionId, studentId, subject } = req.query;
    const query = {};

    // If sessionId provided, filter by session
    if (sessionId) {
      query.attendanceSession = sessionId;
    }

    // Filter by student (accepts studentId string or Mongo _id)
    if (studentId) {
      const trimmedStudentId = studentId.trim();
      let studentDoc = await User.findOne({ studentId: trimmedStudentId }).select('_id');

      if (!studentDoc && mongoose.Types.ObjectId.isValid(trimmedStudentId)) {
        studentDoc = await User.findById(trimmedStudentId).select('_id');
      }

      if (!studentDoc) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: { records: [] }
        });
      }

      query.student = studentDoc._id;
    }

    // Filter by subject (case-insensitive, matches AttendanceSession.subject)
    if (subject) {
      const subjectRegex = new RegExp(subject.trim(), 'i');
      const subjectSessions = await AttendanceSession.find({ subject: subjectRegex }).select('_id');

      if (!subjectSessions.length) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: { records: [] }
        });
      }

      const subjectSessionIds = subjectSessions.map((session) => session._id);

      if (query.attendanceSession) {
        const matchesSubject = subjectSessionIds.some((id) =>
          id.equals(query.attendanceSession)
        );

        if (!matchesSubject) {
          return res.status(200).json({
            success: true,
            count: 0,
            data: { records: [] }
          });
        }
      } else {
        query.attendanceSession = { $in: subjectSessionIds };
      }
    }

    const MAX_LIMIT = 1000;
    const parsedLimit = parseInt(req.query.limit);
    const normalizedLimit = Number.isNaN(parsedLimit) ? 100 : parsedLimit;
    const safeLimit = normalizedLimit === 0 ? 0 : Math.min(Math.abs(normalizedLimit), MAX_LIMIT);

    let recordsQuery = AttendanceRecord.find(query)
      .populate('student', 'name email studentId')
      .populate('attendanceSession', 'subject date startTime endTime')
      .sort({ timestamp: -1 });

    if (safeLimit !== 0) {
      recordsQuery = recordsQuery.limit(safeLimit);
    }

    const records = await recordsQuery;

    res.status(200).json({
      success: true,
      count: records.length,
      data: { records }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

// @desc    Get attendance records for a specific student
// @route   GET /api/attendance/records/:studentId
// @access  Private (Teacher/Student - student can view own)
export const getStudentAttendanceRecords = async (req, res) => {
  try {
    const { studentId } = req.params;
    const query = { student: studentId };

    // If user is a student, they can only view their own records
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own attendance records'
      });
    }

    const records = await AttendanceRecord.find(query)
      .populate('attendanceSession', 'subject date startTime endTime')
      .sort({ timestamp: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.status(200).json({
      success: true,
      count: records.length,
      data: { records }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};



