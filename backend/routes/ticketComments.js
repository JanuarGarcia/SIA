const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const TicketComment = require('../models/TicketComment');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All comment routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/tickets/:ticketId/comments
 * @desc    Add a comment to a ticket
 * @access  Private
 */
router.post(
  '/:ticketId/comments',
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

      // Check if ticket exists
      const ticket = await Ticket.findById(req.params.ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Check permissions
      const userRole = req.user.role || 'student';
      const isCreator = ticket.createdBy.toString() === req.user.id.toString();
      const isStaff = userRole === 'staff' || userRole === 'admin';
      const { isInternal = false } = req.body;

      // Only staff/admin can create internal comments
      if (isInternal && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Only staff or admin can create internal comments',
        });
      }

      // Ensure user has access to this ticket
      if (!isCreator && !isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only comment on your own tickets or tickets assigned to you.',
        });
      }

      // Check if ticket is closed (students can't comment on closed tickets)
      const closedStatuses = ['Completed', 'Rejected', 'Cancelled'];
      if (closedStatuses.includes(ticket.status) && !isStaff && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Cannot comment on closed tickets',
        });
      }

      const { content, attachments = [] } = req.body;

      // Create comment
      const comment = new TicketComment({
        ticket: ticket._id,
        author: req.user.id,
        content,
        isInternal,
        attachments: Array.isArray(attachments) ? attachments : [],
      });

      await comment.save();
      await comment.populate('author', 'username email firstName lastName');

      // Update ticket's updatedAt
      ticket.updatedAt = Date.now();
      await ticket.save();

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      console.error('Create comment error:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket ID',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error adding comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   GET /api/tickets/:ticketId/comments
 * @desc    Get all comments for a ticket
 * @access  Private
 */
router.get('/:ticketId/comments', async (req, res) => {
  try {
    // Check if ticket exists
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Check permissions
    const userRole = req.user.role || 'student';
    const isCreator = ticket.createdBy.toString() === req.user.id.toString();
    const isStaff = userRole === 'staff' || userRole === 'admin';
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id.toString();

    if (!isCreator && !isStaff && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view comments on your own tickets or tickets assigned to you.',
      });
    }

    // Get comments
    let comments = await TicketComment.find({ ticket: ticket._id })
      .populate('author', 'username email firstName lastName')
      .sort({ createdAt: 1 });

    // Filter internal comments for non-staff users
    if (!isStaff) {
      comments = comments.filter((comment) => !comment.isInternal);
    }

    res.json({
      success: true,
      data: {
        comments,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * @route   PUT /api/tickets/:ticketId/comments/:commentId
 * @desc    Update a comment
 * @access  Private (Only author can update)
 */
router.put(
  '/:ticketId/comments/:commentId',
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Comment must be between 1 and 2000 characters'),
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

      const comment = await TicketComment.findById(req.params.commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found',
        });
      }

      // Verify ticket ID matches
      if (comment.ticket.toString() !== req.params.ticketId) {
        return res.status(400).json({
          success: false,
          message: 'Comment does not belong to this ticket',
        });
      }

      // Only author can update (or admin)
      const userRole = req.user.role || 'student';
      const isAuthor = comment.author.toString() === req.user.id.toString();
      const isAdmin = userRole === 'admin';

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own comments',
        });
      }

      // Cannot update system notes
      if (comment.isSystemNote && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Cannot update system notes',
        });
      }

      const { content, attachments } = req.body;

      if (content) comment.content = content;
      if (attachments !== undefined) {
        comment.attachments = Array.isArray(attachments) ? attachments : [];
      }

      await comment.save();
      await comment.populate('author', 'username email firstName lastName');

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: {
          comment,
        },
      });
    } catch (error) {
      console.error('Update comment error:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket or comment ID',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error updating comment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

/**
 * @route   DELETE /api/tickets/:ticketId/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (Only author or admin can delete)
 */
router.delete('/:ticketId/comments/:commentId', async (req, res) => {
  try {
    const comment = await TicketComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Verify ticket ID matches
    if (comment.ticket.toString() !== req.params.ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Comment does not belong to this ticket',
      });
    }

    // Only author can delete (or admin)
    const userRole = req.user.role || 'student';
    const isAuthor = comment.author.toString() === req.user.id.toString();
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    // Cannot delete system notes (unless admin)
    if (comment.isSystemNote && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete system notes',
      });
    }

    await TicketComment.findByIdAndDelete(req.params.commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket or comment ID',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;

