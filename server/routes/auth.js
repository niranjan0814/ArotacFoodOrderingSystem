const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const brevoClient = require('../utils/brevo');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address } = req.body;

    // Validate the request body (you can add more checks here)
    if (!name || !email || !password || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user without hashing the password
    const newUser = new User({
      name,
      email,
      password,  // No hashing of the password here
      address
    });

    // Save the user
    await newUser.save();

    // Respond with a success message
    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials (user not found)'
      });
    }

    // Check if password matches the plain text password
    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials (password mismatch)'
      });
    }

    // Generate JWT token
    const payload = {
      userId: user.id
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) {
          console.error('JWT error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error signing the token'
          });
        }

        // Return token and user details, excluding password
        const { password, ...userWithoutPassword } = user.toObject();
        
        res.json({
          success: true,
          token,
          user: userWithoutPassword // Return user without password
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Send password reset token
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiry on user model
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send password reset email using Brevo
    const emailResult = await brevoClient.sendPasswordResetEmail(user, resetToken);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Find user by reset token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    // Send confirmation email
    await brevoClient.sendEmail({
      to: user.email,
      name: user.name,
      subject: 'Password Reset Successful',
      htmlContent: `
        <h1>Password Reset Successful</h1>
        <p>Hi ${user.name},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The FoodLove Team</p>
      `
    });
    
    res.json({
      success: true,
      message: 'Password has been reset'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT api/auth/user
// @desc    Update user profile
// @access  Private
router.put('/user', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Validate inputs
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Find user by ID
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    user.name = name;
    user.phone = phone || user.phone; // Only update if provided
    user.address = address || user.address;

    // Save updated user
    await user.save();

    // Return updated user data (excluding password)
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
module.exports = router;
