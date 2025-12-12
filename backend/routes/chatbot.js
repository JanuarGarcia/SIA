const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load FAQ data
let faqData = null;
try {
  const faqPath = path.join(__dirname, '../data/registrar_faq.json');
  if (fs.existsSync(faqPath)) {
    const faqFile = fs.readFileSync(faqPath, 'utf8');
    faqData = JSON.parse(faqFile);
    console.log(`✅ FAQ data loaded successfully: ${faqData.faqs?.length || 0} FAQs`);
  } else {
    console.warn('⚠️ FAQ file not found at:', faqPath);
    faqData = { faqs: [] };
  }
} catch (error) {
  console.error('❌ Error loading FAQ data:', error.message);
  faqData = { faqs: [] };
}

// Load Department data
let departmentData = null;
try {
  const deptPath = path.join(__dirname, '../data/departments.json');
  if (fs.existsSync(deptPath)) {
    const deptFile = fs.readFileSync(deptPath, 'utf8');
    departmentData = JSON.parse(deptFile);
    console.log(`✅ Department data loaded successfully: ${departmentData.departments?.length || 0} departments`);
  } else {
    console.warn('⚠️ Department file not found at:', deptPath);
    departmentData = { departments: [] };
  }
} catch (error) {
  console.error('❌ Error loading department data:', error.message);
  departmentData = { departments: [] };
}

// Greeting patterns
const greetingPatterns = [
  /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|good day)/i,
  /^(hi there|hello there|hey there)/i,
];

// Ticket detection keywords
const ticketKeywords = {
  'OTR Request': ['otr', 'transcript', 'official transcript', 'records', 'tor'],
  'Subject Enrollment': ['enroll', 'enrollment', 'add subject', 'register subject', 'drop subject', 'withdraw subject'],
  'Grade Inquiry': ['grade', 'grades', 'check grade', 'view grade', 'question about grade'],
  'Document Request': ['document', 'certificate', 'diploma', 'coe', 'certificate of enrollment'],
  'Enrollment': ['enrollment', 'enroll', 'change course', 'shift course'],
  'Scholarship': ['scholarship', 'financial aid', 'grant'],
  'Financial Aid': ['financial aid', 'assistance', 'help with payment'],
  'Tuition Payment': ['tuition', 'payment', 'pay', 'fee'],
  'Academic Complaint': ['complaint', 'grievance', 'issue', 'problem'],
  'General Inquiry': ['inquiry', 'question', 'help', 'information'],
};

/**
 * Detect if message is a greeting
 */
function detectGreeting(message) {
  const lowerMessage = message.toLowerCase().trim();
  return greetingPatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Get greeting response
 */
function getGreetingResponse() {
  const hour = new Date().getHours();
  let greeting = 'Hello';
  
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  
  return `${greeting}! I'm the Registrar's Office AI assistant. How can I help you today? I can assist with:\n\n• Requesting documents (OTR, certificates, etc.)\n• Subject enrollment\n• Grade inquiries\n• General questions\n\nJust ask me anything, and I'll help you create a ticket if needed!`;
}

/**
 * Match message against FAQ
 */
function matchFAQ(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const faq of faqData.faqs) {
    // Check if any keyword matches
    const keywordMatch = faq.keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // Check if question is similar
    const questionWords = faq.question.toLowerCase().split(/\s+/);
    const questionMatch = questionWords.filter(word => word.length > 3)
      .some(word => lowerMessage.includes(word));
    
    if (keywordMatch || questionMatch) {
      return faq.answer;
    }
  }
  
  return null;
}

/**
 * Find department by service inquiry
 */
function findDepartmentByService(message) {
  if (!departmentData || !departmentData.departments || departmentData.departments.length === 0) {
    return null;
  }
  
  const lowerMessage = message.toLowerCase();
  
  // Check for location/department inquiry keywords
  const locationKeywords = ['where', 'location', 'find', 'get', 'obtain', 'available', 'can i get', 'how to get'];
  const isLocationInquiry = locationKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!isLocationInquiry) {
    return null;
  }
  
  // Find matching department based on services
  for (const dept of departmentData.departments) {
    if (!dept.services || !Array.isArray(dept.services)) continue;
    
    const serviceMatch = dept.services.some(service => 
      lowerMessage.includes(service.toLowerCase())
    );
    
    if (serviceMatch) {
      return dept;
    }
  }
  
  return null;
}

/**
 * Format department information for chatbot response
 */
function formatDepartmentInfo(department) {
  let response = `You can find that at the **${department.name}**.\n\n`;
  response += `📍 **Location:** ${department.location}\n`;
  response += `🕐 **Hours:** ${department.hours}\n`;
  
  if (department.contact) {
    response += `📧 **Email:** ${department.contact}\n`;
  }
  
  if (department.phone) {
    response += `📞 **Phone:** ${department.phone}\n`;
  }
  
  response += `\nWould you like me to create a ticket for this inquiry, or do you need more information?`;
  
  return response;
}

/**
 * Detect ticket category from message
 */
function detectTicketCategory(message) {
  const lowerMessage = message.toLowerCase();
  
  for (const [category, keywords] of Object.entries(ticketKeywords)) {
    const matchCount = keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      return category;
    }
  }
  
  return 'General Inquiry';
}

/**
 * Extract ticket information from message
 */
function extractTicketInfo(message, category) {
  const info = {
    title: message.substring(0, 100), // Use first 100 chars as title
    description: message,
    category: category,
    priority: 'Normal',
  };
  
  // Detect priority
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately')) {
    info.priority = 'Urgent';
  } else if (lowerMessage.includes('important') || lowerMessage.includes('soon')) {
    info.priority = 'High';
  }
  
  // Extract request details based on category
  info.requestDetails = {};
  
  if (category === 'OTR Request') {
    // Try to extract number of copies
    const copiesMatch = message.match(/(\d+)\s*(copy|copies)/i);
    if (copiesMatch) {
      info.requestDetails.numberOfCopies = parseInt(copiesMatch[1]);
    }
    
    // Try to extract purpose
    const purposeMatch = message.match(/purpose[:\s]+(.+?)(?:\.|$)/i);
    if (purposeMatch) {
      info.requestDetails.purpose = purposeMatch[1].trim();
    }
  }
  
  if (category === 'Subject Enrollment') {
    // Try to extract subject code
    const subjectCodeMatch = message.match(/(?:subject\s+code|code)[:\s]+([A-Z0-9]+)/i);
    if (subjectCodeMatch) {
      info.requestDetails.subjectCode = subjectCodeMatch[1].toUpperCase();
    }
    
    // Try to extract subject name
    const subjectNameMatch = message.match(/(?:subject|course)[:\s]+([A-Za-z\s]+?)(?:\.|$)/i);
    if (subjectNameMatch) {
      info.requestDetails.subjectName = subjectNameMatch[1].trim();
    }
  }
  
  return info;
}

/**
 * Build department context for GPT
 */
function buildDepartmentContext() {
  if (!departmentData || !departmentData.departments || departmentData.departments.length === 0) {
    return '';
  }
  
  let context = '\n\nAvailable Departments and Services:\n';
  departmentData.departments.forEach(dept => {
    if (dept.services && Array.isArray(dept.services)) {
      context += `- ${dept.name}: ${dept.location}. Services: ${dept.services.join(', ')}. Hours: ${dept.hours}.\n`;
    }
  });
  
  return context;
}

/**
 * Call GPT-4o-mini for fallback response
 */
async function getGPTResponse(message, userId) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return "I'm here to help with registrar-related inquiries. Could you please provide more details about your question? You can also create a ticket for assistance.";
    }
    
    const departmentContext = buildDepartmentContext();
    
    const systemPrompt = `You are a helpful AI assistant for a university registrar's office. Help students with questions about enrollment, transcripts, grades, and other university services. Be friendly, professional, and concise. If a student needs to create a ticket, guide them on how to do so.${departmentContext}\n\nWhen students ask about where to find services or departments, provide specific location information from the department list above.`;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        max_tokens: 250,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return "I'm having trouble processing that right now. Please try rephrasing your question or create a ticket for assistance.";
  }
}

/**
 * Detect if message is asking about ticket status
 */
function detectTicketStatusInquiry(message) {
  const lowerMessage = message.toLowerCase();
  const statusKeywords = [
    'ticket status', 'check ticket', 'my tickets', 'ticket status', 
    'status of', 'ticket number', 'view ticket', 'show ticket',
    'what is my ticket', 'where is my ticket', 'ticket update',
    'ticket progress', 'ticket information', 'my ticket info'
  ];
  
  return statusKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Extract ticket number from message if mentioned
 */
function extractTicketNumber(message) {
  // Look for patterns like "TICKET-20241212-ABC123" or just the number part
  const ticketPattern = /TICKET-[\dA-Z-]+/i;
  const match = message.match(ticketPattern);
  if (match) {
    return match[0].toUpperCase();
  }
  
  // Also check for just mentioning a ticket number after "ticket" or "#"
  const numberPattern = /(?:ticket|#)\s*([A-Z0-9-]+)/i;
  const numberMatch = message.match(numberPattern);
  if (numberMatch) {
    return numberMatch[1].toUpperCase();
  }
  
  return null;
}

/**
 * Get user's tickets from database
 */
async function getUserTickets(userId, ticketNumber = null) {
  try {
    const query = { createdBy: userId };
    
    if (ticketNumber) {
      query.ticketNumber = ticketNumber;
    }
    
    const tickets = await Ticket.find(query)
      .populate('createdBy', 'username email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10); // Limit to most recent 10 tickets
    
    return tickets;
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    throw error;
  }
}

/**
 * Format ticket status information for chatbot response
 */
function formatTicketStatus(tickets, isSpecificTicket = false) {
  if (!tickets || tickets.length === 0) {
    return "I couldn't find any tickets in your account. Would you like to create a new ticket?";
  }
  
  if (isSpecificTicket && tickets.length === 1) {
    const ticket = tickets[0];
    const statusEmoji = {
      'Pending': '⏳',
      'In Review': '👀',
      'Approved': '✅',
      'Rejected': '❌',
      'Completed': '✔️',
      'Cancelled': '🚫',
      'On Hold': '⏸️'
    };
    
    const priorityEmoji = {
      'Low': '🟢',
      'Normal': '🟡',
      'High': '🟠',
      'Urgent': '🔴'
    };
    
    const emoji = statusEmoji[ticket.status] || '📋';
    const priorityIcon = priorityEmoji[ticket.priority] || '🟡';
    
    const createdDate = new Date(ticket.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    let response = `Here's the status of your ticket:\n\n`;
    response += `${emoji} **Ticket #${ticket.ticketNumber}**\n`;
    response += `📝 Title: ${ticket.title}\n`;
    response += `📊 Status: ${ticket.status}\n`;
    response += `${priorityIcon} Priority: ${ticket.priority}\n`;
    response += `📁 Category: ${ticket.category}\n`;
    response += `📅 Created: ${createdDate}\n`;
    
    if (ticket.assignedTo) {
      response += `👤 Assigned to: ${ticket.assignedTo.firstName || ticket.assignedTo.username}\n`;
    }
    
    if (ticket.status === 'Rejected' && ticket.resolution?.rejectionReason) {
      response += `\n❌ Rejection Reason: ${ticket.resolution.rejectionReason}\n`;
    }
    
    if (ticket.status === 'Completed' && ticket.resolution?.resolutionNotes) {
      response += `\n✅ Resolution: ${ticket.resolution.resolutionNotes}\n`;
    }
    
    response += `\nYou can view full details in the Tickets section.`;
    
    return response;
  }
  
  // Multiple tickets or list view
  let response = `I found ${tickets.length} ticket${tickets.length > 1 ? 's' : ''} in your account:\n\n`;
  
  tickets.forEach((ticket, index) => {
    const statusEmoji = {
      'Pending': '⏳',
      'In Review': '👀',
      'Approved': '✅',
      'Rejected': '❌',
      'Completed': '✔️',
      'Cancelled': '🚫',
      'On Hold': '⏸️'
    };
    
    const emoji = statusEmoji[ticket.status] || '📋';
    const createdDate = new Date(ticket.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    response += `${index + 1}. ${emoji} **#${ticket.ticketNumber}** - ${ticket.title}\n`;
    response += `   Status: ${ticket.status} | Priority: ${ticket.priority} | ${createdDate}\n\n`;
  });
  
  if (tickets.length >= 10) {
    response += `\n(Showing most recent 10 tickets. View all tickets in the Tickets section.)`;
  }
  
  response += `\nWould you like to know more about a specific ticket? Just mention the ticket number!`;
  
  return response;
}

/**
 * Create ticket automatically
 */
async function createTicket(ticketInfo, userId) {
  try {
    // Ensure required fields are present with proper validation
    const ticketData = {
      title: (ticketInfo.title || 'Chatbot Request').substring(0, 200), // Ensure max length
      description: (ticketInfo.description || ticketInfo.title || 'Request created via chatbot').substring(0, 5000),
      category: ticketInfo.category || 'General Inquiry',
      priority: ticketInfo.priority || 'Normal',
      createdBy: userId,
      status: 'Pending',
      requestDetails: ticketInfo.requestDetails || {},
    };
    
    // Validate title length
    if (ticketData.title.length < 5) {
      ticketData.title = 'Request from chatbot: ' + ticketData.title;
    }
    
    // Validate description length
    if (ticketData.description.length < 10) {
      ticketData.description = ticketData.description + ' (Created via chatbot)';
    }
    
    const ticket = new Ticket(ticketData);
    await ticket.save();
    
    // Populate creator info
    await ticket.populate('createdBy', 'username email firstName lastName');
    
    return ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    // Log more details for debugging
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })));
    }
    throw error;
  }
}

/**
 * @route   POST /api/chatbot/message
 * @desc    Process chatbot message and return response
 * @access  Private (Authenticated users)
 */
router.post(
  '/message',
  authenticate,
  [
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('userId')
      .optional()
      .isMongoId()
      .withMessage('Invalid user ID'),
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

      const { message } = req.body;
      const userId = req.user._id || req.user.id; // Use authenticated user's ID
      
      let response = {
        text: '',
        action: null, // 'ticket_created', 'ticket_status', 'ticket_offer', or null
        ticket: null,
        tickets: null, // For status inquiries
      };

      // 1. Check for greeting
      if (detectGreeting(message)) {
        response.text = getGreetingResponse();
        return res.json({
          success: true,
          data: response,
        });
      }

      // 2. Check if user is confirming ticket creation
      const lowerMessage = message.toLowerCase().trim();
      const isTicketConfirmation = lowerMessage === 'yes' || 
                                   lowerMessage === 'y' || 
                                   lowerMessage === 'create ticket' ||
                                   lowerMessage === 'create' ||
                                   lowerMessage.includes('yes, create') ||
                                   lowerMessage.includes('yes create') ||
                                   lowerMessage === 'ok' ||
                                   lowerMessage === 'okay' ||
                                   lowerMessage === 'sure';
      
      // Check if we have conversation context from request body
      const { conversationContext } = req.body;
      
      // If user confirms ticket creation, use the original message from context
      if (isTicketConfirmation && conversationContext && conversationContext.originalMessage) {
        const originalMessage = conversationContext.originalMessage;
        const category = conversationContext.category || detectTicketCategory(originalMessage) || 'General Inquiry';
        const ticketInfo = extractTicketInfo(originalMessage, category);
        
        try {
          const ticket = await createTicket(ticketInfo, userId);
          response.text = `Great! I've created a ticket (#${ticket.ticketNumber}) for your request: "${ticket.title}".\n\nOur staff will review it and respond within 1-2 business days. You can track your ticket status in the Tickets section.\n\nIs there anything else I can help you with?`;
          response.action = 'ticket_created';
          response.ticket = {
            id: ticket._id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
          };
        } catch (error) {
          console.error('Ticket creation error:', error);
          response.text = "I'm having trouble creating the ticket right now. Please try creating a ticket manually through the Tickets section, or let me know if you'd like to try again.";
        }
        
        return res.json({
          success: true,
          data: response,
        });
      }
      
      // If user confirms but we don't have context, try to create from current message
      if (isTicketConfirmation) {
        const category = detectTicketCategory(message) || 'General Inquiry';
        const ticketInfo = extractTicketInfo(message, category);
        
        try {
          const ticket = await createTicket(ticketInfo, userId);
          response.text = `Great! I've created a ticket (#${ticket.ticketNumber}) for your request: "${ticket.title}".\n\nOur staff will review it and respond within 1-2 business days. You can track your ticket status in the Tickets section.\n\nIs there anything else I can help you with?`;
          response.action = 'ticket_created';
          response.ticket = {
            id: ticket._id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
          };
        } catch (error) {
          console.error('Ticket creation error:', error);
          response.text = "I'm having trouble creating the ticket right now. Please try creating a ticket manually through the Tickets section, or let me know if you'd like to try again.";
        }
        
        return res.json({
          success: true,
          data: response,
        });
      }

      // 3. Check for department/service location inquiries
      const department = findDepartmentByService(message);
      if (department) {
        response.text = formatDepartmentInfo(department);
        response.action = 'department_info';
        
        // Check if they might want to create a ticket
        const ticketIndicators = ['request', 'need', 'want', 'apply', 'create', 'submit', 'help with', 'inquiry'];
        const mightNeedTicket = ticketIndicators.some(indicator => 
          lowerMessage.includes(indicator)
        );
        
        if (mightNeedTicket) {
          response.text += '\n\nWould you like me to create a ticket for this? Just reply "yes" or "create ticket" and I\'ll set it up for you.';
          response.action = 'ticket_offer';
          const category = detectTicketCategory(message);
          response.conversationContext = {
            originalMessage: message,
            category: category,
          };
        }
        
        return res.json({
          success: true,
          data: response,
        });
      }

      // 4. Try to match FAQ
      const faqAnswer = matchFAQ(message);
      if (faqAnswer) {
        response.text = faqAnswer;
        
        // Check if the question suggests they might want to create a ticket
        const ticketIndicators = ['request', 'need', 'want', 'apply', 'create', 'submit', 'help with'];
        const mightNeedTicket = ticketIndicators.some(indicator => 
          lowerMessage.includes(indicator)
        );
        
        if (mightNeedTicket) {
          const category = detectTicketCategory(message);
          response.text += '\n\nWould you like me to create a ticket for this request? Just reply "yes" or "create ticket" and I\'ll set it up for you.';
          response.action = 'ticket_offer';
          response.conversationContext = {
            originalMessage: message,
            category: category,
          };
        }
        
        return res.json({
          success: true,
          data: response,
        });
      }

      // 5. Check for ticket status inquiries
      if (detectTicketStatusInquiry(lowerMessage)) {
        try {
          const ticketNumber = extractTicketNumber(message);
          const tickets = await getUserTickets(userId, ticketNumber);
          
          if (tickets.length === 0) {
            if (ticketNumber) {
              response.text = `I couldn't find a ticket with number #${ticketNumber} in your account. Please check the ticket number and try again, or ask me to show all your tickets.`;
            } else {
              response.text = "I couldn't find any tickets in your account. Would you like to create a new ticket?";
            }
          } else {
            response.text = formatTicketStatus(tickets, !!ticketNumber);
            response.action = 'ticket_status';
            response.tickets = tickets.map(t => ({
              id: t._id,
              ticketNumber: t.ticketNumber,
              title: t.title,
              status: t.status,
              priority: t.priority,
              category: t.category,
            }));
          }
        } catch (error) {
          console.error('Error fetching ticket status:', error);
          response.text = "I'm having trouble retrieving your ticket information right now. Please try again or check your tickets in the Tickets section.";
        }
        
        return res.json({
          success: true,
          data: response,
        });
      }

      // 6. Detect if message indicates ticket creation need (but don't auto-create)
      const ticketIndicators = [
        'request', 'need', 'want', 'apply', 'create', 'submit', 
        'help with', 'assistance', 'issue', 'problem'
      ];
      
      const needsTicket = ticketIndicators.some(indicator => 
        lowerMessage.includes(indicator)
      );

      if (needsTicket) {
        const category = detectTicketCategory(message);
        response.text = `I understand you need help with that. I can create a ticket for your request so our staff can assist you.\n\nWould you like me to create a ticket? Just reply "yes" or "create ticket" and I'll set it up for you.`;
        response.action = 'ticket_offer';
        response.conversationContext = {
          originalMessage: message,
          category: category,
        };
        
        return res.json({
          success: true,
          data: response,
        });
      }

      // 7. Fallback to GPT-4o-mini
      const gptResponse = await getGPTResponse(message, userId);
      response.text = gptResponse;
      
      return res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error('Chatbot error:', error);
      console.error('Error stack:', error.stack);
      
      // Provide more helpful error messages
      let errorMessage = 'Error processing message';
      if (error.name === 'ValidationError') {
        errorMessage = 'Invalid request data';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
);

module.exports = router;

