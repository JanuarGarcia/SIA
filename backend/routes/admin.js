const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const TicketComment = require('../models/TicketComment');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

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

module.exports = router;

