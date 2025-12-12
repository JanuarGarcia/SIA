const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    index: true,
    // Default function always generates a unique ticket number
    // This ensures the field always has a value before validation
    default: function() {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
      const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `TICKET-${dateStr}-${timestamp}${randomStr}`;
    },
  },
  title: {
    type: String,
    required: [true, 'Ticket title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'OTR Request',           // Official Transcript of Records
        'Subject Enrollment',     // Adding/Dropping subjects
        'Grade Inquiry',          // Questioning grades
        'Document Request',       // Various document requests
        'Enrollment',             // General enrollment issues
        'Scholarship',            // Scholarship applications/inquiries
        'Financial Aid',          // Financial aid requests
        'Tuition Payment',        // Payment-related issues
        'Academic Complaint',     // Academic grievances
        'Course Evaluation',      // Course/teacher evaluation
        'Library',                // Library services
        'General Inquiry',        // General questions
        'Technical Support',      // System/technical issues
        'Other',
      ],
      message: '{VALUE} is not a valid category',
    },
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: [
        'Pending',      // Just submitted, waiting for review
        'In Review',    // Being reviewed by staff/faculty
        'Approved',     // Request approved, processing
        'Rejected',     // Request rejected
        'Completed',    // Successfully completed
        'Cancelled',    // Cancelled by student
        'On Hold',      // Temporarily on hold
      ],
      message: '{VALUE} is not a valid status',
    },
    default: 'Pending',
    index: true,
  },
  priority: {
    type: String,
    required: true,
    enum: {
      values: ['Low', 'Normal', 'High', 'Urgent'],
      message: '{VALUE} is not a valid priority',
    },
    default: 'Normal',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ticket creator is required'],
    index: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  // Additional fields for specific request types
  requestDetails: {
    // For OTR requests
    numberOfCopies: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: [500, 'Purpose cannot exceed 500 characters'],
    },
    deliveryMethod: {
      type: String,
      enum: ['Pickup', 'Email', 'Mail', 'Digital Download'],
      default: 'Pickup',
    },
    // For Subject Enrollment
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Subject code cannot exceed 20 characters'],
    },
    subjectName: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject name cannot exceed 200 characters'],
    },
    semester: {
      type: String,
      trim: true,
      maxlength: [20, 'Semester cannot exceed 20 characters'],
    },
    academicYear: {
      type: String,
      trim: true,
      maxlength: [20, 'Academic year cannot exceed 20 characters'],
    },
    // Student information (for verification)
    studentId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [50, 'Student ID cannot exceed 50 characters'],
    },
    course: {
      type: String,
      trim: true,
      maxlength: [100, 'Course cannot exceed 100 characters'],
    },
    yearLevel: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate', 'Other'],
    },
  },
  // Attachments (file references - you'll handle actual file storage separately)
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
  // Internal notes (visible only to staff/admin)
  internalNotes: [
    {
      note: {
        type: String,
        required: true,
        trim: true,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Resolution information
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Resolution notes cannot exceed 2000 characters'],
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
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
  closedAt: {
    type: Date,
  },
  // SLA tracking (for university purposes)
  firstResponseAt: {
    type: Date,
  },
  estimatedCompletionDate: {
    type: Date,
  },
});

// Ensure ticket number is generated if default didn't work (fallback)
ticketSchema.pre('validate', function (next) {
  // Only set if it's new and still doesn't have a ticket number
  if (this.isNew && (!this.ticketNumber || this.ticketNumber === '' || this.ticketNumber === null || this.ticketNumber === undefined)) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.ticketNumber = `TICKET-${dateStr}-${timestamp}${randomStr}`;
  }
  next();
});

// Update updatedAt timestamp before saving
ticketSchema.pre('save', function (next) {
  // Update updatedAt timestamp
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Update status-specific timestamps
ticketSchema.pre('save', function (next) {
  // Set firstResponseAt when status changes from Pending
  if (this.isModified('status') && this.status !== 'Pending' && !this.firstResponseAt) {
    this.firstResponseAt = Date.now();
  }

  // Set closedAt when status is Completed, Rejected, or Cancelled
  if (
    this.isModified('status') &&
    ['Completed', 'Rejected', 'Cancelled'].includes(this.status) &&
    !this.closedAt
  ) {
    this.closedAt = Date.now();
  }

  // Set resolvedAt when status is Completed or Rejected
  if (
    this.isModified('status') &&
    ['Completed', 'Rejected'].includes(this.status) &&
    !this.resolution.resolvedAt
  ) {
    this.resolution.resolvedAt = Date.now();
    if (!this.resolution.resolvedBy && this.assignedTo) {
      this.resolution.resolvedBy = this.assignedTo;
    }
  }

  next();
});

// Index for better query performance
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ category: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

// Method to get ticket data without sensitive internal notes (for students)
ticketSchema.methods.toPublicJSON = function () {
  const ticketObject = this.toObject();
  delete ticketObject.internalNotes;
  return ticketObject;
};

// Static method to generate ticket statistics
ticketSchema.statics.getStatistics = async function (userId, role = 'student') {
  const query = role === 'admin' || role === 'staff' ? {} : { createdBy: userId };
  
  const stats = {
    total: await this.countDocuments(query),
    pending: await this.countDocuments({ ...query, status: 'Pending' }),
    inReview: await this.countDocuments({ ...query, status: 'In Review' }),
    approved: await this.countDocuments({ ...query, status: 'Approved' }),
    completed: await this.countDocuments({ ...query, status: 'Completed' }),
    rejected: await this.countDocuments({ ...query, status: 'Rejected' }),
    byCategory: await this.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  };

  return stats;
};

module.exports = mongoose.model('Ticket', ticketSchema);

