import User from '../models/User.model.js';
import Subject from '../models/Subject.model.js';

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin)
export const getTeachers = async (req, res) => {
  try {
    const { department, search } = req.query;
    const query = { role: 'teacher', isActive: true };

    if (department) {
      query.department = department;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const teachers = await User.find(query)
      .select('-password')
      .populate('subjects', 'name code')
      .sort({ teacherId: 1 })
      .limit(parseInt(req.query.limit) || 100);

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: { teachers }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
export const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({
      _id: req.params.id,
      role: 'teacher'
    })
      .select('-password')
      .populate('subjects', 'name code');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get teacher's subjects count
    const subjectsCount = await Subject.countDocuments({ teacher: teacher._id });

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          ...teacher.toObject(),
          statistics: {
            subjectsCount
          }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher',
      error: error.message
    });
  }
};



