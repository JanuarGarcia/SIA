import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { adminController } from '../../controllers/adminController';
import '../../styles/Admin.css';

const AdminCategoryManagement = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Add/Edit form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminController.getCategories();
      if (response.success && response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
      } else {
        setCategories([]);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch categories';
      setError(errorMessage);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '' });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '' });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      if (editingCategory) {
        // Update category
        await adminController.updateCategory(editingCategory, formData.name);
        setSuccess(`Category "${editingCategory}" updated to "${formData.name}" successfully`);
      } else {
        // Add new category
        await adminController.addCategory(formData.name);
        setSuccess(`Category "${formData.name}" added successfully`);
      }
      
      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({ name: '' });
      fetchCategories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving category:', err);
      setFormError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category}"?`)) {
      return;
    }

    try {
      await adminController.deleteCategory(category);
      setSuccess(`Category "${category}" deleted successfully`);
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete category';
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
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Header />
      
      <div className="admin-content">
        <div className="admin-page-header">
          <h2>Category Management</h2>
          <p>Manage ticket categories that users can select when creating tickets</p>
        </div>

        {error && (
          <div className="error-message-card" style={{ marginBottom: '20px' }}>
            <span className="error-icon">⚠️</span>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              <button
                onClick={fetchCategories}
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
            <h3>Categories ({categories.length})</h3>
            <button
              className="btn-primary-action"
              onClick={handleAdd}
              disabled={showAddForm}
            >
              + Add Category
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="admin-widget" style={{ marginBottom: '20px' }}>
            <div className="widget-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            </div>
            <div className="widget-content">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="categoryName">
                    Category Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder="Enter category name"
                    required
                    minLength={1}
                    maxLength={100}
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
                    {submitting ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
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
            {categories.length === 0 ? (
              <div className="widget-empty">
                <p>No categories found. Add your first category to get started.</p>
              </div>
            ) : (
              <div className="category-list">
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr key={index}>
                        <td>{category}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(category)}
                            style={{ marginRight: '8px', padding: '6px 12px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(category)}
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

export default AdminCategoryManagement;

