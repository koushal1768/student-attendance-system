import User from '../models/User.model.js';

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private (Teacher/Admin)
export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('-password -faceEmbedding')
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
// @route   GET /api/users/students/:id
// @access  Private (Teacher/Admin)
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: 'student'
    }).select('-password -faceEmbedding');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { student }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
};

// @desc    Add a student
// @route   POST /api/users/students
// @access  Private (Teacher/Admin)
export const addStudent = async (req, res) => {
  try {
    const { name, email, password, studentId } = req.body;

    if (!name || !email || !password || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and studentId'
      });
    }

    // Check if student already exists
    const existingStudent = await User.findOne({
      $or: [
        { email },
        { studentId }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student already exists with this email or student ID'
      });
    }

    const student = await User.create({
      name,
      email,
      password,
      studentId,
      role: 'student'
    });

    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add student',
      error: error.message
    });
  }
};

// @desc    Update a student
// @route   PUT /api/users/students/:id
// @access  Private (Teacher/Admin)
export const updateStudent = async (req, res) => {
  try {
    const { name, email, studentId } = req.body;

    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if email or studentId already taken by another user
    if (email || studentId) {
      const existing = await User.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(email ? [{ email }] : []),
          ...(studentId ? [{ studentId }] : [])
        ]
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email or student ID already taken'
        });
      }
    }

    if (name) student.name = name;
    if (email) student.email = email;
    if (studentId) student.studentId = studentId;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
};

// @desc    Delete a student
// @route   DELETE /api/users/students/:id
// @access  Private (Teacher/Admin)
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Soft delete - set isActive to false
    student.isActive = false;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
};



