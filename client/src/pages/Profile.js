import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { profileController } from '../controllers/profileController';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setError(null);
    setSuccess(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const validateProfile = () => {
    const errors = {};

    if (!formData.username || formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }

    if (formData.firstName && formData.firstName.length > 50) {
      errors.firstName = 'First name cannot exceed 50 characters';
    }

    if (formData.lastName && formData.lastName.length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateProfile()) {
      return;
    }

    setLoading(true);

    try {
      const response = await profileController.updateProfile(formData);
      await updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.param] = error.msg;
        });
        setValidationErrors(serverErrors);
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to update profile. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await profileController.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.param] = error.msg;
        });
        setValidationErrors(serverErrors);
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to change password. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Please enter your password to confirm account deletion');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await profileController.deleteAccount(deletePassword);
      await logout();
      navigate('/login');
      alert('Your account has been deleted successfully.');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(
        err.response?.data?.message ||
          'Failed to delete account. Please check your password and try again.'
      );
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      username: user.username || '',
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    setValidationErrors({});
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="profile-container">
        <Header />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Header />
      
      <div className="profile-content">
        <div className="profile-page-header">
          <h2>My Profile</h2>
          <p>Manage your account settings and information</p>
        </div>
        {error && (
          <div className="error-message-card">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message-card">
            <span className="success-icon">✓</span>
            {success}
          </div>
        )}

        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Profile Information</h2>
            {!isEditing && !isAdmin && (
              <button
                className="btn-edit"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
            {isAdmin && (
              <span className="admin-notice">
                Admin profiles cannot be edited
              </span>
            )}
          </div>

          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                </div>
              </div>
              
              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="info-label">Username:</span>
                  <span className="info-value">{user.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user.email}</span>
                </div>
                {user.firstName && (
                  <div className="info-item">
                    <span className="info-label">First Name:</span>
                    <span className="info-value">{user.firstName}</span>
                  </div>
                )}
                {user.lastName && (
                  <div className="info-item">
                    <span className="info-label">Last Name:</span>
                    <span className="info-value">{user.lastName}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Role:</span>
                  <span className="info-value role-badge">{user.role || 'student'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status:</span>
                  <span className={`info-value status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">{formatDate(user.createdAt)}</span>
                </div>
                {user.lastLogin && (
                  <div className="info-item">
                    <span className="info-label">Last Login:</span>
                    <span className="info-value">{formatDate(user.lastLogin)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="username">
                  Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={validationErrors.username ? 'error' : ''}
                />
                {validationErrors.username && (
                  <span className="error-message">{validationErrors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={validationErrors.email ? 'error' : ''}
                />
                {validationErrors.email && (
                  <span className="error-message">{validationErrors.email}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={validationErrors.firstName ? 'error' : ''}
                  />
                  {validationErrors.firstName && (
                    <span className="error-message">
                      {validationErrors.firstName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={validationErrors.lastName ? 'error' : ''}
                  />
                  {validationErrors.lastName && (
                    <span className="error-message">
                      {validationErrors.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password Card */}
        {!isAdmin && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h2>Change Password</h2>
              {!isChangingPassword && (
                <button
                  className="btn-edit"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change Password
                </button>
              )}
            </div>

          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group">
                <label htmlFor="currentPassword">
                  Current Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={validationErrors.currentPassword ? 'error' : ''}
                />
                {validationErrors.currentPassword && (
                  <span className="error-message">
                    {validationErrors.currentPassword}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={validationErrors.newPassword ? 'error' : ''}
                />
                {validationErrors.newPassword && (
                  <span className="error-message">
                    {validationErrors.newPassword}
                  </span>
                )}
                <span className="form-hint">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={validationErrors.confirmPassword ? 'error' : ''}
                />
                {validationErrors.confirmPassword && (
                  <span className="error-message">
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setValidationErrors({});
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <p className="info-text">
                Click "Change Password" to update your password. You'll need to
                enter your current password for security.
              </p>
            </div>
          )}
          </div>
        )}

        {/* Delete Account Card - Hidden for Admins */}
        {!isAdmin && (
          <div className="profile-card danger-zone">
          <div className="profile-card-header">
            <h2>Delete Account</h2>
          </div>
          <div className="danger-zone-content">
            <p className="warning-text">
              <strong>Warning:</strong> Deleting your account is permanent and
              cannot be undone. All your data, including tickets and comments,
              will be permanently deleted.
            </p>
            {!showDeleteConfirm ? (
              <button
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete My Account
              </button>
            ) : (
              <div className="delete-confirm">
                <p className="confirm-text">
                  Are you sure you want to delete your account? This action
                  cannot be undone.
                </p>
                <div className="form-group">
                  <label htmlFor="deletePassword">
                    Enter your password to confirm:
                  </label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-danger"
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

