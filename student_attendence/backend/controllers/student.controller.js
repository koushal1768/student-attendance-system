import User from '../models/User.model.js';
import Attendance from '../models/Attendance.model.js';
import Subject from '../models/Subject.model.js';

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Teacher/Admin)
export const getStudents = async (req, res) => {
  try {
    const { batch, semester, search } = req.query;
    const query = { role: 'student', isActive: true };

    if (batch) {
      query.batch = batch;
    }

    if (semester) {
      query.semester = parseInt(semester);
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ studentId: 1 })
      .limit(parseInt(req.query.limit) || 100);

    res.status(200).json({
      success: true,
      count: students.length,
      data: { students }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: 'student'
    }).select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student attendance statistics
    const totalAttendance = await Attendance.countDocuments({ student: student._id });
    const presentCount = await Attendance.countDocuments({
      student: student._id,
      status: 'present'
    });
    const attendancePercentage = totalAttendance > 0
      ? ((presentCount / totalAttendance) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        student: {
          ...student.toObject(),
          statistics: {
            totalAttendance,
            presentCount,
            attendancePercentage: parseFloat(attendancePercentage)
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
};



