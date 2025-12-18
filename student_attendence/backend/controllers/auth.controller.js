import User from '../models/User.model.js';
import { generateToken } from '../utils/generateToken.js';
import axios from 'axios'; // --- ADDED: Python AI service ko call karne ke liye

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    // --- CHANGED: 'faceImage' & 'adminSecret' ko req.body se nikalein ---
    const { name, email, password, role, studentId, faceImage, adminSecret } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Agar koi HOD/admin banne ki koshish kare, to secret check karein
    if (role === 'admin') {
      const expectedSecret = process.env.HOD_SECRET;
      if (!expectedSecret) {
        return res.status(500).json({
          success: false,
          message: 'HOD registration is not configured on server (missing HOD_SECRET).'
        });
      }

      if (!adminSecret || adminSecret !== expectedSecret) {
        return res.status(403).json({
          success: false,
          message: 'Invalid HOD registration code.'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        ...(studentId ? [{ studentId }] : [])
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or student ID'
      });
    }

    // --- CHANGED: userData object mein 'faceImageUrl' add karein ---
    const userData = {
      name,
      email,
      password,
      role,
      ...(role === 'student' && studentId && { studentId }),
      ...(role === 'student' && faceImage && { faceImageUrl: faceImage }), // Image ko yahan save karein
      // HOD/admin ko default verified maan lein
      ...(role === 'admin' && { isVerified: true })
    };

    // Create user
    const user = await User.create(userData);

    // --- ADDED: AI Service ko call karke Face Embedding generate karein ---
    if (user.role === 'student' && faceImage) {
      try {
        // Apne Python service ko call karein
        const aiResponse = await axios.post('http://localhost:8000/generate-embedding', {
          userId: user._id,
          faceImage: faceImage // Base64 string bhejein
        });

        if (aiResponse.data.embedding) {
          // Python server se mile embedding ko save karein
          user.faceEmbedding = aiResponse.data.embedding;
          user.isFaceRegistered = true;
          await user.save();
        }
      } catch (aiError) {
        // Agar AI service fail hoti hai, tab bhi registration fail na karein.
        // Bas error ko log karein. User baad mein embedding upload kar sakta hai.
        console.error("AI Service Error (Registration):", aiError.message);
      }
    }
    // --- END OF AI INTEGRATION ---

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...(user.studentId && { studentId: user.studentId })
        },
        token
      }
    });
  } catch (error) {
    console.error("SERVER CRASH HONE KA ASLI REASON:", error); 
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  // --- NO CHANGES NEEDED HERE ---
  // (Aapka login code jaisa tha waisa hi hai)
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Student/Teacher ke liye HOD verification required hai
    if ((user.role === 'student' || user.role === 'teacher') && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending HOD verification.'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          ...(user.studentId && { studentId: user.studentId }),
          isFaceRegistered: user.isFaceRegistered,
          isVerified: user.isVerified
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};