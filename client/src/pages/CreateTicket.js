import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ticketController } from '../controllers/ticketController';
import '../styles/CreateTicket.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    otherCategory: '', // For custom category when "Other" is selected
    priority: 'Normal',
    requestDetails: {
      numberOfCopies: 1,
      purpose: '',
      subjectCode: '',
      subjectName: '',
      semester: '',
      academicYear: '',
      studentId: '',
      course: '',
      yearLevel: '',
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await ticketController.getCategories();
      if (response.success && response.data && Array.isArray(response.data.categories)) {
        setCategories(response.data.categories);
        // Set default category if available and not already set
        if (response.data.categories.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: response.data.categories[0] }));
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please refresh the page.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await ticketController.getCourses();
      if (response.success && response.data && Array.isArray(response.data.courses)) {
        setCourses(response.data.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      // Don't show error for courses, it's optional
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('requestDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        requestDetails: {
          ...prev.requestDetails,
          [field]: value,
        },
      }));
    } else if (name === 'category') {
      // When category changes, clear otherCategory if not "Other"
      setFormData((prev) => ({
        ...prev,
        category: value,
        otherCategory: value === 'Other' ? prev.otherCategory : '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title || formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description || formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    // Validate "Other" category - require otherCategory field
    if (formData.category === 'Other') {
      if (!formData.otherCategory || formData.otherCategory.trim().length < 3) {
        errors.otherCategory = 'Please specify the category (minimum 3 characters)';
      }
    }

    // Validate category-specific fields
    if (formData.category === 'OTR Request') {
      if (formData.requestDetails.numberOfCopies < 1 || formData.requestDetails.numberOfCopies > 10) {
        errors.numberOfCopies = 'Number of copies must be between 1 and 10';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Clean up empty requestDetails fields
      const cleanedRequestDetails = {};
      Object.keys(formData.requestDetails).forEach((key) => {
        const value = formData.requestDetails[key];
        if (value !== '' && value !== null && value !== undefined) {
          cleanedRequestDetails[key] = value;
        }
      });

      // If "Other" category is selected, use the custom category as the actual category
      const finalCategory = formData.category === 'Other' && formData.otherCategory.trim()
        ? formData.otherCategory.trim()
        : formData.category;

      const ticketData = {
        ...formData,
        category: finalCategory, // Use custom category instead of "Other"
        requestDetails: cleanedRequestDetails,
      };

      // Remove otherCategory from ticketData
      delete ticketData.otherCategory;

      const response = await ticketController.createTicket(ticketData);
      navigate(`/tickets/${response.data.ticket._id}`);
    } catch (err) {
      console.error('Error creating ticket:', err);
      if (err.response?.data?.errors) {
        // Handle validation errors from server
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.param] = error.msg;
        });
        setValidationErrors(serverErrors);
      } else {
        setError(
          err.response?.data?.message ||
            'Failed to create ticket. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getCategorySpecificFields = () => {
    switch (formData.category) {
      case 'OTR Request':
        return (
          <>
            <div className="form-group">
              <label htmlFor="numberOfCopies">
                Number of Copies <span className="required">*</span>
              </label>
              <input
                type="number"
                id="numberOfCopies"
                name="requestDetails.numberOfCopies"
                value={formData.requestDetails.numberOfCopies}
                onChange={handleInputChange}
                min="1"
                max="10"
                className={validationErrors.numberOfCopies ? 'error' : ''}
              />
              {validationErrors.numberOfCopies && (
                <span className="error-message">
                  {validationErrors.numberOfCopies}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="purpose">Purpose</label>
              <input
                type="text"
                id="purpose"
                name="requestDetails.purpose"
                value={formData.requestDetails.purpose}
                onChange={handleInputChange}
                placeholder="e.g., Graduate school application"
              />
            </div>
          </>
        );

      case 'Subject Enrollment':
        return (
          <>
            <div className="form-group">
              <label htmlFor="subjectCode">Subject Code</label>
              <input
                type="text"
                id="subjectCode"
                name="requestDetails.subjectCode"
                value={formData.requestDetails.subjectCode}
                onChange={handleInputChange}
                placeholder="e.g., CS 401"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subjectName">Subject Name</label>
              <input
                type="text"
                id="subjectName"
                name="requestDetails.subjectName"
                value={formData.requestDetails.subjectName}
                onChange={handleInputChange}
                placeholder="e.g., Advanced Database Systems"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <input
                  type="text"
                  id="semester"
                  name="requestDetails.semester"
                  value={formData.requestDetails.semester}
                  onChange={handleInputChange}
                  placeholder="e.g., Fall"
                />
              </div>

              <div className="form-group">
                <label htmlFor="academicYear">Academic Year</label>
                <input
                  type="text"
                  id="academicYear"
                  name="requestDetails.academicYear"
                  value={formData.requestDetails.academicYear}
                  onChange={handleInputChange}
                  placeholder="e.g., 2024-2025"
                />
              </div>
            </div>
          </>
        );

      case 'Grade Inquiry':
        return (
          <>
            <div className="form-group">
              <label htmlFor="subjectCode">Subject Code</label>
              <input
                type="text"
                id="subjectCode"
                name="requestDetails.subjectCode"
                value={formData.requestDetails.subjectCode}
                onChange={handleInputChange}
                placeholder="e.g., CS 201"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subjectName">Subject Name</label>
              <input
                type="text"
                id="subjectName"
                name="requestDetails.subjectName"
                value={formData.requestDetails.subjectName}
                onChange={handleInputChange}
                placeholder="e.g., Data Structures"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <input
                  type="text"
                  id="semester"
                  name="requestDetails.semester"
                  value={formData.requestDetails.semester}
                  onChange={handleInputChange}
                  placeholder="e.g., Spring"
                />
              </div>

              <div className="form-group">
                <label htmlFor="academicYear">Academic Year</label>
                <input
                  type="text"
                  id="academicYear"
                  name="requestDetails.academicYear"
                  value={formData.requestDetails.academicYear}
                  onChange={handleInputChange}
                  placeholder="e.g., 2023-2024"
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-ticket-container">
      <Header />
      
      <div className="create-ticket-content">
        <div className="create-ticket-page-header">
          <h2>Create New Ticket</h2>
          <p>Submit a new support request</p>
        </div>
        <form onSubmit={handleSubmit} className="ticket-form">
          {error && (
            <div className="error-message-card">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="category">
                Category <span className="required">*</span>
              </label>
              {loadingCategories ? (
                <select disabled>
                  <option>Loading categories...</option>
                </select>
              ) : (
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={validationErrors.category ? 'error' : ''}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
              {validationErrors.category && (
                <span className="error-message">{validationErrors.category}</span>
              )}
            </div>

            {/* Show "Other Category" input field when "Other" is selected */}
            {formData.category === 'Other' && (
              <div className="form-group">
                <label htmlFor="otherCategory">
                  Other Category <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="otherCategory"
                  name="otherCategory"
                  value={formData.otherCategory}
                  onChange={handleInputChange}
                  placeholder="Please specify the category"
                  className={validationErrors.otherCategory ? 'error' : ''}
                  maxLength={100}
                />
                {validationErrors.otherCategory && (
                  <span className="error-message">{validationErrors.otherCategory}</span>
                )}
                <span className="form-hint">
                  Enter the category name that is not in the list above.
                </span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief description of your request"
                className={validationErrors.title ? 'error' : ''}
              />
              {validationErrors.title && (
                <span className="error-message">{validationErrors.title}</span>
              )}
              <span className="form-hint">
                Minimum 5 characters. Be specific and clear.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about your request..."
                rows="6"
                className={validationErrors.description ? 'error' : ''}
              />
              {validationErrors.description && (
                <span className="error-message">
                  {validationErrors.description}
                </span>
              )}
              <span className="form-hint">
                Minimum 10 characters. Include all relevant details.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <span className="form-hint">
                Urgent: Deadline within 3 days | High: Within 1 week | Normal:
                Standard requests
              </span>
            </div>
          </div>

          {getCategorySpecificFields() && (
            <div className="form-section">
              <h2>Additional Details</h2>
              {getCategorySpecificFields()}
            </div>
          )}

          <div className="form-section">
            <h2>Student Information (Optional but Recommended)</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="requestDetails.studentId"
                  value={formData.requestDetails.studentId}
                  onChange={handleInputChange}
                  placeholder="e.g., 2020-12345"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="course">Course/Program</label>
                {loadingCourses ? (
                  <select disabled>
                    <option>Loading courses...</option>
                  </select>
                ) : (
                  <select
                    id="course"
                    name="requestDetails.course"
                    value={formData.requestDetails.course}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Course/Program</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="yearLevel">Year Level</label>
              <select
                id="yearLevel"
                name="requestDetails.yearLevel"
                value={formData.requestDetails.yearLevel}
                onChange={handleInputChange}
              >
                <option value="">Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
                <option value="Graduate">Graduate</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/tickets')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating Ticket...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;

