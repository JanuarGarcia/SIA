import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    loginMethod: 'email', // 'email' or 'username'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect admin users to admin dashboard, regular users to regular dashboard
      if (user.role === 'admin') {
        navigate('/admin/tickets');
      } else {
        navigate('/dashboard');
      }
    } else if (isAuthenticated && !user) {
      // If authenticated but user data not loaded yet, just go to dashboard
      // The actual redirect will happen when user data loads
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      loginMethod: method,
      email: '',
      username: '',
    }));
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.loginMethod === 'email') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    } else {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    const credentials =
      formData.loginMethod === 'email'
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, password: formData.password };

    const result = await login(credentials);

    if (result.success) {
      // Navigation will be handled by useEffect when user state updates
      // It will check the user role and redirect accordingly
    } else {
      setErrors({ submit: result.message || 'Login failed. Please try again.' });
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>AI Chatbot & Ticketing System</h1>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Login Method Toggle */}
          <div className="method-toggle">
            <button
              type="button"
              className={`toggle-btn ${formData.loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => handleMethodChange('email')}
            >
              Email
            </button>
            <button
              type="button"
              className={`toggle-btn ${formData.loginMethod === 'username' ? 'active' : ''}`}
              onClick={() => handleMethodChange('username')}
            >
              Username
            </button>
          </div>

          {/* Email Input */}
          {formData.loginMethod === 'email' && (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
          )}

          {/* Username Input */}
          {formData.loginMethod === 'username' && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? 'error' : ''}
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
          )}

          {/* Password Input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

