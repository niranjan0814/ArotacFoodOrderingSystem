import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.css';

const Login = ({ setAuthStatus }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }
  
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setAuthStatus('authenticated');
      
      toast.success('Login successful! Redirecting...', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setTimeout(() => navigate('/menu/view'), 2000);
      
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.', {
        position: "top-center"
      });
      localStorage.removeItem('token');
      setAuthStatus('unauthenticated');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2 className="login-title">Sign in to your account</h2>
        <form onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label htmlFor="email" className="login-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="login-input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="login-input-group">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="login-input"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="login-spacing">
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="text-center mt-4">
            <a 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;