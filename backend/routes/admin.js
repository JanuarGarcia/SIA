const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const TicketComment = require('../models/TicketComment');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const fs = require('fs');
const path = require('path');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/tickets
 * @desc    Get all tickets for admin review (with filters)
 * @access  Private (Admin only)
 */
router.get(
  '/tickets',
  [
    query('status')
      .optional()
      .isIn(['Pending', 'In Review', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'On Hold'])
      .withMessage('Invalid status'),
    query('category').optional().trim(),
    query('priority')
      .optional()
      .isIn(['Low', 'Normal', 'High', 'Urgent'])
      .withMessage('Invalid priority'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'updatedAt', 'priority', 'status'])
      .withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().trim().isLength({ max: 200 }).withMessage('Search query cannot exceed 200 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        status,
        category,
        priority,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Build query - admin sees all tickets
      const query = {};

      if (status) query.status = status;
      if (category) query.category = category;
      if (priority) query.priority = priority;

      // Search functionality
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { ticketNumber: searchRegex },
          { 'requestDetails.subjectCode': searchRegex },
          { 'requestDetails.subjectName': searchRegex },
          { 'requestDetails.studentId': searchRegex },
          { 'requestDetails.course': searchRegex },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Get tickets
      const tickets = await Ticket.find(query)
        .populate('createdBy', 'username email firstName lastName')
        .populate('assignedTo', 'username email firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Ticket.countDocuments(query);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      console.error('Admin get tickets error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching tickets',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/admin/tickets/:id
 * @desc    Get ticket details for admin review
 * @access  Private (Admin only)
 */
router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'username email firstName lastName')
      .populate('assignedTo', 'username email firstName lastName');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Get all comments (admin can see both public and internal)
    const comments = await TicketComment.find({ ticket: ticket._id })
      .populate('author', 'username email firstName lastName')
      .sort({ createdAt: 'asc' });

    res.json({
      success: true,
      data: {
        ticket,
        comments,
      },
    });
  } catch (error) {
    console.error('Admin get ticket error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   PUT /api/admin/tickets/:id/status
 * @desc    Update ticket status and add remarks (Admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/tickets/:id/status',
  [
    body('status')
      .isIn(['Pending', 'In Review', 'Completed'])
      .withMessage('Status must be Pending, In Review, or Completed'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Remarks cannot exceed 2000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      const { status, remarks } = req.body;
      const oldStatus = ticket.status;

      // Update ticket status
      ticket.status = status;
      ticket.updatedAt = Date.now();

      // If there are remarks, add them as a comment
      if (remarks && remarks.trim()) {
        const comment = new TicketComment({
          ticket: ticket._id,
          author: req.user.id,
          content: remarks.trim(),
          isInternal: false, // Admin remarks are visible to users
        });
        await comment.save();
      }

      await ticket.save();

      // Create a system comment for status change
      const statusComment = new TicketComment({
        ticket: ticket._id,
        author: req.user.id,
        content: `Status changed from "${oldStatus}" to "${status}" by admin`,
        isSystemNote: true,
      });
      await statusComment.save();

      // Populate the updated ticket
      await ticket.populate('createdBy', 'username email firstName lastName');
      await ticket.populate('assignedTo', 'username email firstName lastName');

      res.json({
        success: true,
        message: 'Ticket status updated successfully',
        data: {
          ticket,
        },
      });
    } catch (error) {
      console.error('Admin update ticket status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating ticket status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   POST /api/admin/tickets/:id/comments
 * @desc    Add a remark/comment to a ticket (Admin only)
 * @access  Private (Admin only)
 */
router.post(
  '/tickets/:id/comments',
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Comment must be between 1 and 2000 characters'),
    body('isInternal')
      .optional()
      .isBoolean()
      .withMessage('isInternal must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const ticket = await Ticket.findById(req.params.id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      const { content, isInternal = false } = req.body;

      const comment = new TicketComment({
        ticket: ticket._id,
        author: req.user.id,
        content: content.trim(),
        isInternal: isInternal,
      });

      await comment.save();
      await comment.populate('author', 'username email firstName lastName');

      res.json({
        success: true,
        message: 'Remark added successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      console.error('Admin add comment error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error adding remark',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get ticket statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/statistics', async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const pending = await Ticket.countDocuments({ status: 'Pending' });
    const inReview = await Ticket.countDocuments({ status: 'In Review' });
    const completed = await Ticket.countDocuments({ status: 'Completed' });
    const approved = await Ticket.countDocuments({ status: 'Approved' });
    const rejected = await Ticket.countDocuments({ status: 'Rejected' });
    const cancelled = await Ticket.countDocuments({ status: 'Cancelled' });
    const onHold = await Ticket.countDocuments({ status: 'On Hold' });

    // Get statistics by category (filter out null/undefined)
    const byCategory = await Ticket.aggregate([
      {
        $match: {
          category: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get statistics by priority (filter out null/undefined)
    const byPriority = await Ticket.aggregate([
      {
        $match: {
          priority: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get statistics by status (filter out null/undefined)
    const byStatus = await Ticket.aggregate([
      {
        $match: {
          status: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get tickets created in the last 30 days (for time-based chart)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ticketsByDate = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get tickets by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const ticketsByMonth = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Ensure all arrays are properly formatted, even if empty
    const formatStatsArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(item => item && item._id && item.count !== undefined)
        .map(item => ({
          name: String(item._id || ''),
          value: Number(item.count || 0),
        }));
    };

    const formatDateArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(item => item && item._id && item.count !== undefined)
        .map(item => ({
          date: String(item._id || ''),
          count: Number(item.count || 0),
        }));
    };

    const formatMonthArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(item => item && item._id && item.count !== undefined)
        .map(item => ({
          month: String(item._id || ''),
          count: Number(item.count || 0),
        }));
    };

    res.json({
      success: true,
      data: {
        statistics: {
          total: Number(total || 0),
          pending: Number(pending || 0),
          inReview: Number(inReview || 0),
          completed: Number(completed || 0),
          approved: Number(approved || 0),
          rejected: Number(rejected || 0),
          cancelled: Number(cancelled || 0),
          onHold: Number(onHold || 0),
          byCategory: formatStatsArray(byCategory),
          byPriority: formatStatsArray(byPriority),
          byStatus: formatStatsArray(byStatus),
          ticketsByDate: formatDateArray(ticketsByDate),
          ticketsByMonth: formatMonthArray(ticketsByMonth),
        },
      },
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Utility function to read categories from file
 */
const getCategories = () => {
  try {
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    if (fs.existsSync(categoriesPath)) {
      const categoriesFile = fs.readFileSync(categoriesPath, 'utf8');
      const categories = JSON.parse(categoriesFile);
      if (Array.isArray(categories)) {
        return categories;
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
};

/**
 * Utility function to write categories to file
 */
const saveCategories = (categories) => {
  try {
    const categoriesPath = path.join(__dirname, '../data/categories.json');
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing categories:', error);
    throw error;
  }
};

/**
 * Utility function to read courses from file
 */
const getCourses = () => {
  try {
    const coursesPath = path.join(__dirname, '../data/courses.json');
    if (fs.existsSync(coursesPath)) {
      const coursesFile = fs.readFileSync(coursesPath, 'utf8');
      const courses = JSON.parse(coursesFile);
      if (Array.isArray(courses)) {
        return courses;
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error('Error reading courses:', error);
    return [];
  }
};

/**
 * Utility function to write courses to file
 */
const saveCourses = (courses) => {
  try {
    const coursesPath = path.join(__dirname, '../data/courses.json');
    fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing courses:', error);
    throw error;
  }
};

/**
 * @route   GET /api/admin/categories
 * @desc    Get all categories
 * @access  Private (Admin only)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = getCategories();
    res.json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   POST /api/admin/categories
 * @desc    Add a new category
 * @access  Private (Admin only)
 */
router.post(
  '/categories',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const categories = getCategories();
      const newCategory = req.body.name.trim();

      // Check if category already exists
      if (categories.includes(newCategory)) {
        return res.status(400).json({
          success: false,
          message: 'Category already exists',
        });
      }

      categories.push(newCategory);
      saveCategories(categories);

      res.json({
        success: true,
        message: 'Category added successfully',
        data: {
          category: newCategory,
          categories,
        },
      });
    } catch (error) {
      console.error('Add category error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error adding category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   PUT /api/admin/categories/:oldName
 * @desc    Update a category name
 * @access  Private (Admin only)
 */
router.put(
  '/categories/:oldName',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be between 1 and 100 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const categories = getCategories();
      const oldName = decodeURIComponent(req.params.oldName);
      const newName = req.body.name.trim();

      // Check if old category exists
      const oldIndex = categories.indexOf(oldName);
      if (oldIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      // Check if new category name already exists (and it's not the same)
      if (categories.includes(newName) && oldName !== newName) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists',
        });
      }

      // Update category in array
      categories[oldIndex] = newName;
      saveCategories(categories);

      // Update all tickets with the old category name
      try {
        await Ticket.updateMany(
          { category: oldName },
          { $set: { category: newName } }
        );
      } catch (updateError) {
        console.error('Error updating tickets with new category:', updateError);
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: {
          oldName,
          newName,
          categories,
        },
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating category',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/categories/:name
 * @desc    Delete a category
 * @access  Private (Admin only)
 */
router.delete('/categories/:name', async (req, res) => {
  try {
    const categories = getCategories();
    const categoryName = decodeURIComponent(req.params.name);

    // Check if category exists
    const categoryIndex = categories.indexOf(categoryName);
    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category is being used by any tickets
    const ticketCount = await Ticket.countDocuments({ category: categoryName });
    if (ticketCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is being used by ${ticketCount} ticket(s).`,
        data: {
          ticketCount,
        },
      });
    }

    // Remove category from array
    categories.splice(categoryIndex, 1);
    saveCategories(categories);

    res.json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        deletedCategory: categoryName,
        categories,
      },
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses
 * @access  Private (Admin only)
 */
router.get('/courses', async (req, res) => {
  try {
    const courses = getCourses();
    res.json({
      success: true,
      data: {
        courses,
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   POST /api/admin/courses
 * @desc    Add a new course
 * @access  Private (Admin only)
 */
router.post(
  '/courses',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Course name must be between 1 and 200 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const courses = getCourses();
      const newCourse = req.body.name.trim();

      // Check if course already exists
      if (courses.includes(newCourse)) {
        return res.status(400).json({
          success: false,
          message: 'Course already exists',
        });
      }

      courses.push(newCourse);
      saveCourses(courses);

      res.json({
        success: true,
        message: 'Course added successfully',
        data: {
          course: newCourse,
          courses,
        },
      });
    } catch (error) {
      console.error('Add course error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error adding course',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   PUT /api/admin/courses/:oldName
 * @desc    Update a course name
 * @access  Private (Admin only)
 */
router.put(
  '/courses/:oldName',
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Course name must be between 1 and 200 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const courses = getCourses();
      const oldName = decodeURIComponent(req.params.oldName);
      const newName = req.body.name.trim();

      // Check if old course exists
      const oldIndex = courses.indexOf(oldName);
      if (oldIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      // Check if new course name already exists (and it's not the same)
      if (courses.includes(newName) && oldName !== newName) {
        return res.status(400).json({
          success: false,
          message: 'Course name already exists',
        });
      }

      // Update course in array
      courses[oldIndex] = newName;
      saveCourses(courses);

      // Update all tickets with the old course name
      try {
        await Ticket.updateMany(
          { 'requestDetails.course': oldName },
          { $set: { 'requestDetails.course': newName } }
        );
      } catch (updateError) {
        console.error('Error updating tickets with new course:', updateError);
      }

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: {
          oldName,
          newName,
          courses,
        },
      });
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating course',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/courses/:name
 * @desc    Delete a course
 * @access  Private (Admin only)
 */
router.delete('/courses/:name', async (req, res) => {
  try {
    const courses = getCourses();
    const courseName = decodeURIComponent(req.params.name);

    // Check if course exists
    const courseIndex = courses.indexOf(courseName);
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if course is being used by any tickets
    const ticketCount = await Ticket.countDocuments({ 'requestDetails.course': courseName });
    if (ticketCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course. It is being used by ${ticketCount} ticket(s).`,
        data: {
          ticketCount,
        },
      });
    }

    // Remove course from array
    courses.splice(courseIndex, 1);
    saveCourses(courses);

    res.json({
      success: true,
      message: 'Course deleted successfully',
      data: {
        deletedCourse: courseName,
        courses,
      },
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Utility function to read offices from file
 */
const getOffices = () => {
  try {
    const officesPath = path.join(__dirname, '../data/offices.json');
    if (fs.existsSync(officesPath)) {
      const officesFile = fs.readFileSync(officesPath, 'utf8');
      const offices = JSON.parse(officesFile);
      if (Array.isArray(offices)) {
        return offices;
      }
      return [];
    }
    return [];
  } catch (error) {
    console.error('Error reading offices:', error);
    return [];
  }
};

/**
 * Utility function to write offices to file
 */
const saveOffices = (offices) => {
  try {
    const officesPath = path.join(__dirname, '../data/offices.json');
    fs.writeFileSync(officesPath, JSON.stringify(offices, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing offices:', error);
    throw error;
  }
};

/**
 * @route   GET /api/admin/offices
 * @desc    Get all office locations
 * @access  Private (Admin only)
 */
router.get('/offices', async (req, res) => {
  try {
    const offices = getOffices();
    res.json({
      success: true,
      data: {
        offices,
      },
    });
  } catch (error) {
    console.error('Get offices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching offices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   POST /api/admin/offices
 * @desc    Add a new office location
 * @access  Private (Admin only)
 */
router.post(
  '/offices',
  [
    body('office_name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Office name must be between 1 and 200 characters'),
    body('building_name')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Building name must be between 1 and 200 characters'),
    body('floor_room')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Floor/room must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const offices = getOffices();
      const {
        office_name,
        office_name_tagalog,
        building_name,
        floor_room,
        description,
        keywords,
        keywords_tagalog,
      } = req.body;

      // Generate ID if not provided
      const id = req.body.id || office_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Check if office with same ID already exists
      if (offices.some(office => office.id === id)) {
        return res.status(400).json({
          success: false,
          message: 'Office with this ID already exists',
        });
      }

      const newOffice = {
        id,
        office_name: office_name.trim(),
        office_name_tagalog: office_name_tagalog?.trim() || '',
        building_name: building_name.trim(),
        floor_room: floor_room.trim(),
        description: description?.trim() || '',
        keywords: Array.isArray(keywords) ? keywords : [],
        keywords_tagalog: Array.isArray(keywords_tagalog) ? keywords_tagalog : [],
      };

      offices.push(newOffice);
      saveOffices(offices);

      res.json({
        success: true,
        message: 'Office added successfully',
        data: {
          office: newOffice,
          offices,
        },
      });
    } catch (error) {
      console.error('Add office error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error adding office',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   PUT /api/admin/offices/:id
 * @desc    Update an office location
 * @access  Private (Admin only)
 */
router.put(
  '/offices/:id',
  [
    body('office_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Office name must be between 1 and 200 characters'),
    body('building_name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Building name must be between 1 and 200 characters'),
    body('floor_room')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Floor/room must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const offices = getOffices();
      const officeId = req.params.id;
      const officeIndex = offices.findIndex(office => office.id === officeId);

      if (officeIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Office not found',
        });
      }

      // Update office fields
      const updatedOffice = {
        ...offices[officeIndex],
        ...(req.body.office_name && { office_name: req.body.office_name.trim() }),
        ...(req.body.office_name_tagalog !== undefined && { office_name_tagalog: req.body.office_name_tagalog.trim() }),
        ...(req.body.building_name && { building_name: req.body.building_name.trim() }),
        ...(req.body.floor_room && { floor_room: req.body.floor_room.trim() }),
        ...(req.body.description !== undefined && { description: req.body.description.trim() }),
        ...(req.body.keywords !== undefined && { keywords: Array.isArray(req.body.keywords) ? req.body.keywords : [] }),
        ...(req.body.keywords_tagalog !== undefined && { keywords_tagalog: Array.isArray(req.body.keywords_tagalog) ? req.body.keywords_tagalog : [] }),
      };

      offices[officeIndex] = updatedOffice;
      saveOffices(offices);

      res.json({
        success: true,
        message: 'Office updated successfully',
        data: {
          office: updatedOffice,
          offices,
        },
      });
    } catch (error) {
      console.error('Update office error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating office',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   DELETE /api/admin/offices/:id
 * @desc    Delete an office location
 * @access  Private (Admin only)
 */
router.delete('/offices/:id', async (req, res) => {
  try {
    const offices = getOffices();
    const officeId = req.params.id;
    const officeIndex = offices.findIndex(office => office.id === officeId);

    if (officeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Office not found',
      });
    }

    const deletedOffice = offices[officeIndex];
    offices.splice(officeIndex, 1);
    saveOffices(offices);

    res.json({
      success: true,
      message: 'Office deleted successfully',
      data: {
        deletedOffice,
        offices,
      },
    });
  } catch (error) {
    console.error('Delete office error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting office',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;

