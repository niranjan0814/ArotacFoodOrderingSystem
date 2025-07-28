import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const EmailVerify = () => {
  const navigate = useNavigate();
  const inputRefs = React.useRef([]);
  const [isVerified, setIsVerified] = useState(false);

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

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      const otpArray = inputRefs.current.map((e) => e.value);
      const otp = otpArray.join("");

      const response = await fetch('http://localhost:5000/api/authHome/verify-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessToast(data.message);
        setIsVerified(true);
        setTimeout(() => navigate('/'), 2000);
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

  useEffect(() => {
    // Check if already verified and redirect
    const checkVerification = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/authHome/check-verification', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.isVerified) {
          navigate('/');
        }
      } catch (error) {
        console.error("Verification check failed:", error);
      }
    };
    checkVerification();
  }, [navigate]);

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
          <h2 className="login-title">Email Verification</h2>
          <p className="login-subtitle">Enter the 6-digit OTP sent to your email</p>

          <form onSubmit={onSubmitHandler} className="login-form">
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
              Verify Email
            </button>
          </form>

          <p className="toggle-auth">
            Didn't receive OTP?{' '}
            <span
              onClick={async () => {
                try {
                  const response = await fetch('http://localhost:5000/api/authHome/resend-otp', {
                    method: 'POST',
                    credentials: 'include',
                  });
                  const data = await response.json();
                  if (response.ok) {
                    showSuccessToast(data.message);
                  } else {
                    toast.error(data.message);
                  }
                } catch (error) {
                  toast.error(error.message);
                }
              }}
              className="toggle-auth-link"
            >
              Resend OTP
            </span>
          </p>
        </div>

        <div className="background-blobs">
          <div className="blob pink-blob"></div>
          <div className="blob indigo-blob"></div>
        </div>
      </div>
    </>
  );
};

export default EmailVerify;