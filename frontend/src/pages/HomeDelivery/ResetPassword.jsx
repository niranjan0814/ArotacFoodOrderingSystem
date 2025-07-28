import React, { useState } from 'react';
import { assets } from '../../assets/assets.js';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSubmited, setIsOtpSubmited] = useState(false);
  const inputRefs = React.useRef([]);

  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      style: {
        background: "#4BB543",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "16px"
      }
    });
  };

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("Text");
    const pasteArray = paste.split("");
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/authHome/send-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessToast(data.message);
        setIsEmailSent(true);
      } else {
        toast.error(data.message || 'An error occurred', {
          position: "top-center",
          theme: "colored",
        });
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred', {
        position: "top-center",
        theme: "colored",
      });
    }
  };

  const onSubmitOtp = (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map((input) => input.value);
    setOtp(otpArray.join(""));
    setIsOtpSubmited(true);
  };

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/authHome/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessToast(data.message);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(data.message || 'An error occurred', {
          position: "top-center",
          theme: "colored",
        });
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred', {
        position: "top-center",
        theme: "colored",
      });
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="login-container">
        <img
          onClick={() => navigate('/')}
          src={assets.SLIIT}
          alt="Logo"
          className="login-logo"
        />

        <div className="login-card">
          {!isEmailSent && (
            <>
              <h2 className="login-title">Reset Password</h2>
              <p className="login-subtitle">Enter your registered email to receive a reset OTP</p>
              
              <form onSubmit={onSubmitEmail} className="login-form">
                <div className="input-group">
                  <img src={assets.mail_icon} alt="Mail" className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <button type="submit" className="submit-button">
                  Send OTP
                </button>
              </form>
            </>
          )}

          {!isOtpSubmited && isEmailSent && (
            <>
              <h2 className="login-title">Enter OTP</h2>
              <p className="login-subtitle">Check your email for the 6-digit code</p>
              
              <form onSubmit={onSubmitOtp} className="login-form">
                <div className="otp-container" onPaste={handlePaste}>
                  {Array(6).fill(0).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      onInput={(e) => handleInput(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      required
                      className="otp-input"
                    />
                  ))}
                </div>

                <button type="submit" className="submit-button">
                  Verify OTP
                </button>
              </form>
            </>
          )}

          {isOtpSubmited && isEmailSent && (
            <>
              <h2 className="login-title">New Password</h2>
              <p className="login-subtitle">Create your new password</p>
              
              <form onSubmit={onSubmitNewPassword} className="login-form">
                <div className="input-group">
                  <img src={assets.lock_icon} alt="Lock" className="input-icon" />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="input-field"
                  />
                </div>

                <button type="submit" className="submit-button">
                  Reset Password
                </button>
              </form>
            </>
          )}
        </div>

        <div className="background-blobs">
          <div className="blob pink-blob"></div>
          <div className="blob indigo-blob"></div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;