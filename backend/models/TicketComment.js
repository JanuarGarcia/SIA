const mongoose = require('mongoose');

const ticketCommentSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true, 'Ticket reference is required'],
    index: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required'],
    index: true,
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters'],
  },
  // For file attachments in comments
  attachments: [
    {
      filename: {
        type: String,
        required: true,
      },
      fileUrl: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // If comment is internal (only visible to staff/admin)
  isInternal: {
    type: Boolean,
    default: false,
  },
  // If comment is a system notification
  isSystemNote: {
    type: Boolean,
    default: false,
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt timestamp
ticketCommentSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Index for better query performance
ticketCommentSchema.index({ ticket: 1, createdAt: -1 });

// Populate author information by default
ticketCommentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'username email firstName lastName',
  });
  next();
});

module.exports = mongoose.model('TicketComment', ticketCommentSchema);

