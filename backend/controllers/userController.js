import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt';

export const getUserData = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id; // Use param ID or authenticated user ID

    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      userData: {
        name: user.name,
        email: user.email,
        address: user.address,
        phoneNumber: user.phoneNumber,
        profilePhoto: user.profilePhoto,
        isAccountVerified: user.isAccountVerified,
      },
    });
  } catch (error) {
    console.error('GetUserData Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUserData = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = {};
    
    // Handle text fields
    if (req.body.name) updates.name = req.body.name;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber;

    // Handle file upload if exists
    if (req.file) {
      // Get current user data
      const currentUser = await userModel.findById(userId);
      
      // If user already has a profile photo, delete the old one from Cloudinary
      if (currentUser.profilePhoto) {
        try {
          // Extract public_id from the URL (last part before file extension)
          const publicId = currentUser.profilePhoto.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);
        } catch (error) {
          console.error('Error deleting old image from Cloudinary:', error);
        }
      }
      
      updates.profilePhoto = req.file.path; // Cloudinary provides the URL in req.file.path
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        address: updatedUser.address,
        phoneNumber: updatedUser.phoneNumber,
        profilePhoto: updatedUser.profilePhoto,
        isAccountVerified: updatedUser.isAccountVerified,
      }
    });
  } catch (error) {
    console.error('UpdateUserData Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Get user ID from auth middleware

    // Find user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('ChangePassword Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};