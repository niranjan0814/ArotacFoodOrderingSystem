import React, { useState } from 'react';
import { assets } from '../../assets/assets.js';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [state, setState] = useState('Sign Up');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      let response;
      const url = state === 'Sign Up' 
        ? 'http://localhost:5000/api/authHome/register' 
        : 'http://localhost:5000/api/authHome/login';
      
      const body = state === 'Sign Up' 
        ? JSON.stringify({ name, email, password }) 
        : JSON.stringify({ email, password });

      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Removed credentials: 'include' for token-based auth
        body: body,
      });

      const data = await response.json();
      console.log('Response Data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        const token = data.token || data.jwt || data.accessToken;
        if (token) {
          localStorage.setItem("token", token);
          const userId = data.userId || data.user?.id;
          if (userId) {
            localStorage.setItem("userId", userId);
          }
          console.log('Token Stored:', localStorage.getItem("token"));
          console.log('UserId Stored:', localStorage.getItem("userId"));
          showSuccessToast(state === 'Sign Up' 
            ? '🎉 Registration Successful! Welcome aboard!' 
            : '👋 Welcome back! Redirecting to menu...');
          setTimeout(() => navigate('/foodList'), 2000);
        } else {
          throw new Error('No token received from server. Response: ' + JSON.stringify(data));
        }
      } else {
        console.log('Error Response:', data);
        let errorMessage = data.message || 'An error occurred';
        if (data.errors) {
          errorMessage = data.errors[0]?.msg || errorMessage;
        }
        toast.error(errorMessage, {
          position: "top-center",
          theme: "colored",
        });
      }
    } catch (error) {
      console.error('Login Error:', error);
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
          <h2 className="login-title">{state === 'Sign Up' ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="login-subtitle">{state === 'Sign Up' ? 'Join us today!' : 'Glad to see you again!'}</p>

          <form onSubmit={onSubmitHandler} className="login-form">
            {state === 'Sign Up' && (
              <div className="input-group">
                <img src={assets.person_icon} alt="Person" className="input-icon" />
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className="input-field"
                  type="text"
                  placeholder="Full Name"
                  required
                />
              </div>
            )}

            <div className="input-group">
              <img src={assets.mail_icon} alt="Mail" className="input-icon" />
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="input-field"
                type="email"
                placeholder="Email ID"
                required
              />
            </div>

            <div className="input-group">
              <img src={assets.lock_icon} alt="Lock" className="input-icon" />
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="input-field"
                type="password"
                placeholder="Password"
                required
              />
            </div>

            <p
              onClick={() => navigate('/reset-password')}
              className="forgot-password"
            >
              Forgot Password?
            </p>

            <button
              type="submit"
              className="submit-button"
            >
              {state}
            </button>
          </form>

          {state === 'Sign Up' ? (
            <p className="toggle-auth">
              Already have an account?{' '}
              <span
                onClick={() => setState('Login')}
                className="toggle-auth-link"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="toggle-auth">
              Don't have an account?{' '}
              <span
                onClick={() => setState('Sign Up')}
                className="toggle-auth-link"
              >
                Sign up
              </span>
            </p>
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

export default Login;