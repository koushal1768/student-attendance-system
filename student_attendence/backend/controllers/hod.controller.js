import User from '../models/User.model.js';

// @desc    Get list of pending users (students & teachers) for HOD verification
// @route   GET /api/hod/pending-users
// @access  Private (admin / HOD)
export const getPendingUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const filter = {
      isVerified: false,
      role: { $in: ['student', 'teacher'] },
    };

    if (role && ['student', 'teacher'].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending users',
      error: error.message,
    });
  }
};

// @desc    Verify a user (student/teacher) by HOD
// @route   POST /api/hod/verify-user/:id
// @access  Private (admin / HOD)
export const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!['student', 'teacher'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Only student and teacher accounts can be verified by HOD',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified',
      });
    }

    user.isVerified = true;
    user.verifiedBy = req.user._id;
    user.verifiedAt = new Date();

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'User verified successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify user',
      error: error.message,
    });
  }
};


