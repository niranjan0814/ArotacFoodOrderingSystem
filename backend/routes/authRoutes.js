import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/Manager.js';
import { check, validationResult } from 'express-validator';
import sendPasswordResetEmail from '../services/emailService.js';
import crypto from 'crypto';
const router = express.Router();

const validatePassword = async (plainPassword, hash) => {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (err) {
    console.error('Password validation error:', err);
    return false;
  }
};

// @route    POST api/auth/login
// @desc     Authenticate user & get token
// @access   Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }

    // Debug logging
    console.log('Login attempt:', {
      email,
      inputPasswordLength: password.length,
      storedHash: user.password.substring(0, 30) + '...'
    });

    const isMatch = await validatePassword(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch between:', {
        input: password,
        storedHash: user.password
      });
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '5h' });
    res.json({ token });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

router.post(
  "/register",
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Create new user
      user = new User({
        name,
        email,
        password
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ message: 'If this email exists, a reset link will be sent' });
    }
    
    // 2. Generate reset token and expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    
    // 3. Save token to user in database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    // 4. Send email
    try {
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (emailSent) {
        console.log('Reset email sent to:', email);
        return res.status(200).json({ 
          message: 'Password reset link sent to your email' 
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Revert the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      throw emailError;
    }
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Error processing your request',
      error: error.message 
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Create new hash
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    // Update user
    user.password = newHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Save and verify
    await user.save();
    const savedUser = await User.findById(user._id).select('+password');
    
    // Double verification
    const isMatch = await validatePassword(newPassword, savedUser.password);
    if (!isMatch) {
      throw new Error('Hash verification failed after save');
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ 
      message: 'Password reset failed',
      error: error.message 
    });
  }
});


export default router;