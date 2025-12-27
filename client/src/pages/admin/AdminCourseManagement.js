import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { adminController } from '../../controllers/adminController';
import '../../styles/Admin.css';

const AdminCourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Add/Edit form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminController.getCourses();
      if (response.success && response.data && Array.isArray(response.data.courses)) {
        setCourses(response.data.courses);
      } else {
        setCourses([]);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch courses';
      setError(errorMessage);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setFormData({ name: '' });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({ name: course });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCourse(null);
    setFormData({ name: '' });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingCourse) {
        // Update course
        await adminController.updateCourse(editingCourse, formData.name);
        setSuccess(`Course "${editingCourse}" updated to "${formData.name}" successfully`);
      } else {
        // Add new course
        await adminController.addCourse(formData.name);
        setSuccess(`Course "${formData.name}" added successfully`);
      }
      
      setShowAddForm(false);
      setEditingCourse(null);
      setFormData({ name: '' });
      fetchCourses();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving course:', err);
      setFormError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course) => {
    if (!window.confirm(`Are you sure you want to delete the course "${course}"?`)) {
      return;
    }

    try {
      await adminController.deleteCourse(course);
      setSuccess(`Course "${course}" deleted successfully`);
      fetchCourses();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting course:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete course';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <Header />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Header />
      
      <div className="admin-content">
        <div className="admin-page-header">
          <h2>Course Management</h2>
          <p>Manage courses/programs that users can select when creating tickets</p>
        </div>

        {error && (
          <div className="error-message-card" style={{ marginBottom: '20px' }}>
            <span className="error-icon">⚠️</span>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              <button
                onClick={fetchCourses}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: 'var(--royal-blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="success-message-card" style={{ marginBottom: '20px' }}>
            <span style={{ marginRight: '8px' }}>✅</span>
            {success}
          </div>
        )}

        <div className="admin-widget" style={{ marginBottom: '20px' }}>
          <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Courses ({courses.length})</h3>
            <button
              className="btn-primary-action"
              onClick={handleAdd}
              disabled={showAddForm}
            >
              + Add Course
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="admin-widget" style={{ marginBottom: '20px' }}>
            <div className="widget-header">
              <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
            </div>
            <div className="widget-content">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="courseName">
                    Course/Program Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder="Enter course/program name"
                    required
                    minLength={1}
                    maxLength={200}
                    disabled={submitting}
                    style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                  />
                  {formError && (
                    <span className="error-message">{formError}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : (editingCourse ? 'Update' : 'Add')}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="admin-widget">
          <div className="widget-content">
            {courses.length === 0 ? (
              <div className="widget-empty">
                <p>No courses found. Add your first course to get started.</p>
              </div>
            ) : (
              <div className="category-list">
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Course/Program Name</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course, index) => (
                      <tr key={index}>
                        <td>{course}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(course)}
                            style={{ marginRight: '8px', padding: '6px 12px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(course)}
                            style={{ padding: '6px 12px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            className="btn-cancel"
            onClick={() => navigate('/admin/tickets')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseManagement;

