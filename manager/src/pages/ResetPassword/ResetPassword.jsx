import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.css'; 

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Submitting with:', { token, password });
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
  
      const data = await response.json(); 
      console.log('Server response:', data);
      
      if (!response.ok) {
        
        throw new Error(data.message || 'Failed to reset password');
      }
      
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message);
      console.error('Reset error:', err); 
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page-container">
        <div className="login-form-container">
          <h2 className="login-title">Invalid Token</h2>
          <p>The password reset link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2 className="login-title">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="password" className="login-label">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="login-input-group">
            <label htmlFor="confirmPassword" className="login-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="login-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="login-spacing">
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;