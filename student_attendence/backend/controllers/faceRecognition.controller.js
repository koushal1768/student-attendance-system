// @desc    Verify face
// @route   POST /api/face-recognition/verify
// @access  Private
export const verifyFace = async (req, res) => {
  try {
    const { image, sessionId } = req.body;
    const userId = req.user._id;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Face image is required'
      });
    }

    // TODO: Integrate with actual face recognition API
    // For now, simulate face recognition
    // In production, you would:
    // 1. Send image to face recognition service
    // 2. Compare with registered face encoding
    // 3. Return confidence score

    // Simulated face recognition response
    const verificationScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const isVerified = verificationScore >= 70;

    res.status(200).json({
      success: true,
      data: {
        verified: isVerified,
        confidenceScore: verificationScore,
        message: isVerified
          ? 'Face verified successfully'
          : 'Face verification failed. Please try again.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Face verification failed',
      error: error.message
    });
  }
};

// @desc    Register face
// @route   POST /api/face-recognition/register
// @access  Private
export const registerFace = async (req, res) => {
  try {
    const { image } = req.body;
    const userId = req.user._id;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Face image is required'
      });
    }

    // TODO: Integrate with actual face recognition API
    // For now, simulate face registration
    // In production, you would:
    // 1. Send image to face recognition service
    // 2. Generate face encoding
    // 3. Store encoding in database

    // Simulated response
    const faceEncoding = `encoded_face_${userId}_${Date.now()}`;

    // Update user with face encoding
    const User = (await import('../models/User.model.js')).default;
    await User.findByIdAndUpdate(userId, {
      faceEncoding,
      isFaceRegistered: true,
      faceImageUrl: image // Store image URL or path
    });

    res.status(200).json({
      success: true,
      message: 'Face registered successfully',
      data: {
        isFaceRegistered: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Face registration failed',
      error: error.message
    });
  }
};



