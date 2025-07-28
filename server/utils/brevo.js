
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Brevo API client for sending transactional emails
const brevoClient = {
  apiKey: process.env.BREVO_API_KEY, // Use environment variable
  
  // Send email with Brevo
  sendEmail: async (params) => {
    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: {
          name: 'FoodLove',
          email: '88b9bc001@smtp-brevo.com'
        },
        to: [
          {
            email: params.to,
            name: params.name || params.to
          }
        ],
        subject: params.subject,
        htmlContent: params.htmlContent
      }, {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY, // Use environment variable
          'content-type': 'application/json'
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Brevo email sending error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send email' 
      };
    }
  },
  
  // Send welcome email to new users
  sendWelcomeEmail: async (user) => {
    return await brevoClient.sendEmail({
      to: user.email,
      name: user.name,
      subject: 'Welcome to FoodLove!',
      htmlContent: `
        <h1>Welcome to FoodLove!</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for registering with FoodLove. We're excited to have you on board!</p>
        <p>You can now log in and start ordering delicious food from our platform.</p>
        <p>Best regards,<br>The FoodLove Team</p>
      `
    });
  },
  
  // Send password reset email
  sendPasswordResetEmail: async (user, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    return await brevoClient.sendEmail({
      to: user.email,
      name: user.name,
      subject: 'Password Reset Request',
      htmlContent: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your FoodLove account.</p>
        <p>Please click the link below to reset your password. This link will expire in 1 hour.</p>
        <p><a href="${resetUrl}" style="padding: 10px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The FoodLove Team</p>
      `
    });
  }
};

module.exports = brevoClient;
