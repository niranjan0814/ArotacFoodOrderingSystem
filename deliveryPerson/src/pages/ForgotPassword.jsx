import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiArrowLeft, FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
    tempToken: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain a number';
    if (!/[!@#$%^&*]/.test(password)) return 'Password must contain a special character';
    return '';
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter your email');
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      setErrors({ email: 'Invalid email format' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/delivery-persons/forgot-password', 
        { email: formData.email },
        { timeout: 10000 }
      );
      
      if (response.data.message === 'OTP sent successfully') {
        toast.success('OTP sent to your email');
        setStep(2);
        setRetryCount(0);
        setErrors({});
      } else {
        throw new Error(response.data.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      let errorMsg = error.response?.data?.error || 
                    error.message || 
                    'Network error - please try again';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMsg = 'Request timeout - server is taking too long to respond';
        if (retryCount < 3) {
          toast.info(`Retrying... (${retryCount + 1}/3)`);
          setRetryCount(retryCount + 1);
          setTimeout(() => handleSendOTP(e), 2000);
          return;
        } else {
          errorMsg = 'Maximum retries reached. Please try again later.';
        }
      }
      
      toast.error(errorMsg);
      setErrors({ email: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      setErrors({ otp: 'Valid 6-digit OTP required' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/delivery-persons/verify-otp', { 
        email: formData.email, 
        otp: formData.otp 
      });
      
      if (!response.data.tempToken) {
        throw new Error('Invalid server response');
      }
      
      setFormData(prev => ({ ...prev, tempToken: response.data.tempToken }));
      toast.success('OTP verified successfully');
      setStep(3);
      setErrors({});
    } catch (error) {
      console.error('OTP Verification Error:', error);
      const errorMsg = error.response?.data?.error || 
                      (error.message.includes('expired') ? 'OTP has expired' : 'Invalid OTP');
      toast.error(errorMsg);
      setErrors({ otp: errorMsg });
      if (errorMsg.includes('expired')) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      toast.error(passwordError);
      setErrors({ newPassword: passwordError });
      return;
    }

    if (!formData.newPassword || formData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      setErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    if (!formData.tempToken) {
      toast.error('Session expired. Please start the process again.');
      setStep(1);
      setErrors({ confirmPassword: 'Session expired' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/delivery-persons/reset-password', {
        tempToken: formData.tempToken,
        newPassword: formData.newPassword
      });
      
      toast.success('Password changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Password Reset Error:', error);
      const errorMsg = error.response?.data?.error || 
                      (error.message.includes('expired') ? 'Session expired - please start again' : 
                      'Failed to reset password');
      toast.error(errorMsg);
      setErrors({ confirmPassword: errorMsg });
      if (errorMsg.includes('expired')) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    } else {
      navigate('/login');
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF6EC] to-[#FFEFD9] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#FF8C00] p-6 text-white text-center relative">
          <button 
            onClick={handleBack}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-orange-200 transition"
            disabled={loading}
            aria-label="Go back"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Password Recovery</h1>
          <p className="text-orange-100 mt-1 text-sm">
            {step === 1 ? 'Enter your registered email' : 
             step === 2 ? `Check your email (${formData.email}) for the OTP` : 
             'Create a new secure password'}
          </p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-4.5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full pl-10 pt-3 pr-3 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none transition disabled:opacity-70"
                    placeholder="your@email.com"
                    aria-describedby="emailError"
                    autoFocus
                  />
                </div>
                {errors.email && (
                  <p id="emailError" className="mt-2 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8C00] transition flex items-center justify-center ${
                  loading ? 'bg-[#FFA726] cursor-not-allowed' : 'bg-[#FF8C00] hover:bg-[#E67F00]'
                }`}
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="mr-2" />
                    Send OTP
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    id="otp"
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none transition text-center text-lg font-mono disabled:opacity-70"
                    placeholder="123456"
                    maxLength={6}
                    aria-describedby="otpError"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code sent to {formData.email}
                </p>
                {errors.otp && (
                  <p id="otpError" className="mt-2 text-sm text-red-600">
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8C00] transition flex items-center justify-center ${
                  loading ? 'bg-[#FFA726] cursor-not-allowed' : 'bg-[#FF8C00] hover:bg-[#E67F00]'
                }`}
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Verifying...
                  </>
                ) : 'Verify Code'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none transition disabled:opacity-70"
                    placeholder="Minimum 8 characters"
                    aria-describedby="newPasswordError"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#666666] hover:text-[#1F1F1F]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEye /> : <FiEyeOff />} {/* Corrected icon logic */}
                  </button>
                </div>
                {errors.newPassword && (
                  <p id="newPasswordError" className="mt-2 text-sm text-red-600">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none transition disabled:opacity-70"
                    placeholder="Re-enter your password"
                    aria-describedby="confirmPasswordError"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#666666] hover:text-[#1F1F1F]"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <FiEye /> : <FiEyeOff />} {/* Corrected icon logic */}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPasswordError" className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8C00] transition flex items-center justify-center ${
                  loading ? 'bg-[#FFA726] cursor-not-allowed' : 'bg-[#FF8C00] hover:bg-[#E67F00]'
                }`}
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;