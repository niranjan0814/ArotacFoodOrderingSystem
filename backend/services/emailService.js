import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: '894b69001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY
  }
});

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: '"AroTac" <darranyakoneswaran@gmail.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 10px 20px; background-color:rgb(9, 43, 116); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="font-size: 16px; color: #666; margin-top: 20px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          ${resetUrl}
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default sendPasswordResetEmail;