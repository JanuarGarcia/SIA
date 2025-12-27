import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { adminController } from '../../controllers/adminController';
import '../../styles/Admin.css';

const AdminOfficeManagement = () => {
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Add/Edit form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [formData, setFormData] = useState({
    office_name: '',
    office_name_tagalog: '',
    building_name: '',
    floor_room: '',
    description: '',
    keywords: '',
    keywords_tagalog: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminController.getOffices();
      if (response.success && response.data && Array.isArray(response.data.offices)) {
        setOffices(response.data.offices);
      } else {
        setOffices([]);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching offices:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch offices';
      setError(errorMessage);
      setOffices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOffice(null);
    setFormData({
      office_name: '',
      office_name_tagalog: '',
      building_name: '',
      floor_room: '',
      description: '',
      keywords: '',
      keywords_tagalog: '',
    });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleEdit = (office) => {
    setEditingOffice(office);
    setFormData({
      office_name: office.office_name || '',
      office_name_tagalog: office.office_name_tagalog || '',
      building_name: office.building_name || '',
      floor_room: office.floor_room || '',
      description: office.description || '',
      keywords: Array.isArray(office.keywords) ? office.keywords.join(', ') : '',
      keywords_tagalog: Array.isArray(office.keywords_tagalog) ? office.keywords_tagalog.join(', ') : '',
    });
    setFormError(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingOffice(null);
    setFormData({
      office_name: '',
      office_name_tagalog: '',
      building_name: '',
      floor_room: '',
      description: '',
      keywords: '',
      keywords_tagalog: '',
    });
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const officeData = {
        office_name: formData.office_name.trim(),
        office_name_tagalog: formData.office_name_tagalog.trim(),
        building_name: formData.building_name.trim(),
        floor_room: formData.floor_room.trim(),
        description: formData.description.trim(),
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
        keywords_tagalog: formData.keywords_tagalog.split(',').map(k => k.trim()).filter(k => k.length > 0),
      };

      if (editingOffice) {
        // Update office
        await adminController.updateOffice(editingOffice.id, officeData);
        setSuccess(`Office "${officeData.office_name}" updated successfully`);
      } else {
        // Add new office
        await adminController.addOffice(officeData);
        setSuccess(`Office "${officeData.office_name}" added successfully`);
      }
      
      setShowAddForm(false);
      setEditingOffice(null);
      setFormData({
        office_name: '',
        office_name_tagalog: '',
        building_name: '',
        floor_room: '',
        description: '',
        keywords: '',
        keywords_tagalog: '',
      });
      fetchOffices();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving office:', err);
      setFormError(err.response?.data?.message || 'Failed to save office');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (office) => {
    if (!window.confirm(`Are you sure you want to delete the office "${office.office_name}"?`)) {
      return;
    }

    try {
      await adminController.deleteOffice(office.id);
      setSuccess(`Office "${office.office_name}" deleted successfully`);
      fetchOffices();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting office:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete office';
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
          <p>Loading offices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Header />
      
      <div className="admin-content">
        <div className="admin-page-header">
          <h2>Office Location Management</h2>
          <p>Manage PSU Urdaneta City Campus office locations for the chatbot location assistance feature</p>
        </div>

        {error && (
          <div className="error-message-card" style={{ marginBottom: '20px' }}>
            <span className="error-icon">⚠️</span>
            <div style={{ flex: 1 }}>
              <div>{error}</div>
              <button
                onClick={fetchOffices}
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
            <h3>Office Locations ({offices.length})</h3>
            <button
              className="btn-primary-action"
              onClick={handleAdd}
              disabled={showAddForm}
            >
              + Add Office
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="admin-widget" style={{ marginBottom: '20px' }}>
            <div className="widget-header">
              <h3>{editingOffice ? 'Edit Office Location' : 'Add New Office Location'}</h3>
            </div>
            <div className="widget-content">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="office_name">
                      Office Name (English) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="office_name"
                      value={formData.office_name}
                      onChange={(e) => setFormData({ ...formData, office_name: e.target.value })}
                      placeholder="e.g., Registrar's Office"
                      required
                      minLength={1}
                      maxLength={200}
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="office_name_tagalog">
                      Office Name (Tagalog)
                    </label>
                    <input
                      type="text"
                      id="office_name_tagalog"
                      value={formData.office_name_tagalog}
                      onChange={(e) => setFormData({ ...formData, office_name_tagalog: e.target.value })}
                      placeholder="e.g., Tanggapan ng Registrar"
                      maxLength={200}
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="building_name">
                      Building Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="building_name"
                      value={formData.building_name}
                      onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                      placeholder="e.g., Administration Building"
                      required
                      minLength={1}
                      maxLength={200}
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="floor_room">
                      Floor/Room <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="floor_room"
                      value={formData.floor_room}
                      onChange={(e) => setFormData({ ...formData, floor_room: e.target.value })}
                      placeholder="e.g., 2nd Floor, Room 201"
                      required
                      minLength={1}
                      maxLength={200}
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this office handles..."
                    rows={3}
                    maxLength={1000}
                    disabled={submitting}
                    style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="keywords">
                      Keywords (English) <span style={{ fontSize: '12px', color: '#666' }}>Comma-separated</span>
                    </label>
                    <input
                      type="text"
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="e.g., registrar, otr, transcript, enrollment"
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="keywords_tagalog">
                      Keywords (Tagalog) <span style={{ fontSize: '12px', color: '#666' }}>Comma-separated</span>
                    </label>
                    <input
                      type="text"
                      id="keywords_tagalog"
                      value={formData.keywords_tagalog}
                      onChange={(e) => setFormData({ ...formData, keywords_tagalog: e.target.value })}
                      placeholder="e.g., registrar, otr, transkrip, enrollment"
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-medium)', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {formError && (
                  <div className="error-message-card" style={{ marginBottom: '20px' }}>
                    <span className="error-icon">⚠️</span>
                    {formError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : (editingOffice ? 'Update Office' : 'Add Office')}
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
            {offices.length === 0 ? (
              <div className="widget-empty">
                <p>No offices found. Add your first office location to get started.</p>
              </div>
            ) : (
              <div className="office-list">
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Office Name</th>
                      <th>Building</th>
                      <th>Location</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offices.map((office) => (
                      <tr key={office.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{office.office_name}</div>
                          {office.office_name_tagalog && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              {office.office_name_tagalog}
                            </div>
                          )}
                        </td>
                        <td>{office.building_name}</td>
                        <td>{office.floor_room}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(office)}
                            style={{ marginRight: '8px', padding: '6px 12px' }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(office)}
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

export default AdminOfficeManagement;

