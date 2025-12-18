import Subject from '../models/Subject.model.js';
import User from '../models/User.model.js';

// @desc    Get all subjects for a teacher
// @route   GET /api/subjects/teacher
// @access  Private (Teacher)
export const getTeacherSubjects = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const subjects = await Subject.find({
      teacher: teacherId,
      isActive: true
    })
      .populate('enrolledStudents', 'studentId firstName lastName')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: { subjects }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
export const getSubjects = async (req, res) => {
  try {
    const { teacherId, department, search } = req.query;
    const query = { isActive: true };

    if (teacherId) {
      query.teacher = teacherId;
    }

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const subjects = await Subject.find(query)
      .populate('teacher', 'firstName lastName teacherId')
      .populate('enrolledStudents', 'studentId firstName lastName')
      .sort({ name: 1 })
      .limit(parseInt(req.query.limit) || 100);

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: { subjects }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
      error: error.message
    });
  }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('teacher', 'firstName lastName teacherId')
      .populate('enrolledStudents', 'studentId firstName lastName rollNumber batch');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { subject }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subject',
      error: error.message
    });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Teacher/Admin)
export const createSubject = async (req, res) => {
  try {
    const { code, name, description, department, semester, credits, schedule, enrolledStudents } = req.body;
    const teacherId = req.user._id;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide code and name'
      });
    }

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code: code.toUpperCase() });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      description,
      teacher: teacherId,
      department,
      semester,
      credits,
      schedule,
      enrolledStudents: enrolledStudents || []
    });

    // Add subject to teacher's subjects array
    await User.findByIdAndUpdate(teacherId, {
      $addToSet: { subjects: subject._id }
    });

    const populatedSubject = await Subject.findById(subject._id)
      .populate('teacher', 'firstName lastName')
      .populate('enrolledStudents', 'studentId firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: { subject: populatedSubject }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create subject',
      error: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Teacher/Admin)
export const updateSubject = async (req, res) => {
  try {
    const { name, description, department, semester, credits, schedule, enrolledStudents } = req.body;
    
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if teacher owns the subject
    if (req.user.role === 'teacher' && subject.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this subject'
      });
    }

    // Update fields
    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (department) subject.department = department;
    if (semester) subject.semester = semester;
    if (credits) subject.credits = credits;
    if (schedule) subject.schedule = schedule;
    if (enrolledStudents) subject.enrolledStudents = enrolledStudents;

    await subject.save();

    const populatedSubject = await Subject.findById(subject._id)
      .populate('teacher', 'firstName lastName')
      .populate('enrolledStudents', 'studentId firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject: populatedSubject }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update subject',
      error: error.message
    });
  }
};



