# University Ticketing System - Backend

A comprehensive ticketing system designed for university purposes, supporting requests like OTR (Official Transcript of Records), Subject Enrollment, Grade Inquiries, and more.

## Features

✅ **Complete CRUD Operations** - Create, Read, Update, Delete tickets  
✅ **University-Specific Categories** - OTR Requests, Subject Enrollment, Grade Inquiries, etc.  
✅ **Status Workflow** - Pending → In Review → Approved/Rejected → Completed  
✅ **Priority Levels** - Low, Normal, High, Urgent  
✅ **Ticket Comments** - Communication between students and staff  
✅ **Internal Notes** - Staff-only comments not visible to students  
✅ **Role-Based Access Control** - Students, Staff, and Admin roles  
✅ **Ticket Assignment** - Assign tickets to specific staff members  
✅ **Comprehensive Validation** - Input validation and error handling  
✅ **Auto-Generated Ticket Numbers** - Unique ticket IDs for tracking  
✅ **Statistics** - Ticket counts by status and category  
✅ **Pagination & Filtering** - Efficient data retrieval  

## Models Created

### 1. Ticket Model (`backend/models/Ticket.js`)
- Comprehensive ticket schema with university-specific fields
- Auto-generated unique ticket numbers (format: TICKET-YYYYMMDD-XXXXX)
- Support for OTR requests, subject enrollment, and other categories
- Status tracking with automatic timestamp updates
- Resolution and rejection handling

### 2. TicketComment Model (`backend/models/TicketComment.js`)
- Comments/replies system for tickets
- Support for internal notes (staff-only)
- File attachments support
- System notes for automated updates

### 3. User Model (Updated)
- Added `role` field: `student`, `staff`, or `admin`
- Default role is `student`

## API Routes

### Ticket Routes (`/api/tickets`)
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets` - Get all tickets (with filters)
- `GET /api/tickets/stats` - Get ticket statistics
- `GET /api/tickets/:id` - Get single ticket with comments
- `PUT /api/tickets/:id` - Update ticket
- `PUT /api/tickets/:id/status` - Update ticket status
- `PUT /api/tickets/:id/assign` - Assign ticket to staff
- `DELETE /api/tickets/:id` - Delete ticket

### Comment Routes (`/api/tickets`)
- `POST /api/tickets/:ticketId/comments` - Add comment
- `GET /api/tickets/:ticketId/comments` - Get all comments
- `PUT /api/tickets/:ticketId/comments/:commentId` - Update comment
- `DELETE /api/tickets/:ticketId/comments/:commentId` - Delete comment

## Categories Supported

1. **OTR Request** - Official Transcript of Records
2. **Subject Enrollment** - Adding/Dropping subjects
3. **Grade Inquiry** - Questioning grades
4. **Document Request** - Various document requests
5. **Enrollment** - General enrollment issues
6. **Scholarship** - Scholarship applications/inquiries
7. **Financial Aid** - Financial aid requests
8. **Tuition Payment** - Payment-related issues
9. **Academic Complaint** - Academic grievances
10. **Course Evaluation** - Course/teacher evaluation
11. **Library** - Library services
12. **General Inquiry** - General questions
13. **Technical Support** - System/technical issues
14. **Other** - Other requests

## Status Workflow

1. **Pending** - Initial status when ticket is created
2. **In Review** - Staff is reviewing the request
3. **Approved** - Request approved, processing
4. **Completed** - Successfully completed
5. **Rejected** - Request rejected (with reason)
6. **Cancelled** - Cancelled by student
7. **On Hold** - Temporarily on hold

## Permission Rules

### Students
- Can create tickets
- Can view only their own tickets
- Can update only their own tickets with `Pending` or `Cancelled` status
- Can cancel their own tickets if status is `Pending` or `In Review`
- Can delete their own tickets with `Pending` status
- Cannot see internal comments

### Staff
- Can view all tickets
- Can update any ticket
- Can change ticket status
- Can assign tickets to staff members
- Can create internal comments
- Can see all comments (including internal)

### Admin
- All staff permissions
- Can delete any ticket
- Can update/delete system notes

## Request Details Structure

### For OTR Requests
```json
{
  "numberOfCopies": 2,
  "purpose": "Graduate school application",
  "deliveryMethod": "Email",
  "studentId": "2020-12345",
  "course": "Bachelor of Science in Computer Science",
  "yearLevel": "4th Year"
}
```

### For Subject Enrollment
```json
{
  "subjectCode": "CS 401",
  "subjectName": "Advanced Database Systems",
  "semester": "Fall",
  "academicYear": "2024-2025",
  "studentId": "2020-12345",
  "course": "Bachelor of Science in Computer Science",
  "yearLevel": "3rd Year"
}
```

## Quick Start

1. **Start the backend server** (if not already running)
   ```bash
   cd backend
   npm start
   # or for development
   npm run dev
   ```

2. **Test the API**
   - Use the provided `test-tickets.http` file
   - Or use Postman/cURL
   - See `TICKET_API_DOCUMENTATION.md` for detailed examples

3. **Example: Create an OTR Request**
   ```bash
   POST http://localhost:5000/api/tickets
   Authorization: Bearer <your-jwt-token>
   Content-Type: application/json
   
   {
     "title": "Request for Official Transcript of Records",
     "description": "I need 2 copies of my official transcript",
     "category": "OTR Request",
     "priority": "High",
     "requestDetails": {
       "numberOfCopies": 2,
       "deliveryMethod": "Email",
       "studentId": "2020-12345"
     }
   }
   ```

## Files Created/Modified

### New Files
- `backend/models/Ticket.js` - Ticket model
- `backend/models/TicketComment.js` - Comment model
- `backend/routes/tickets.js` - Ticket routes
- `backend/routes/ticketComments.js` - Comment routes
- `backend/TICKET_API_DOCUMENTATION.md` - Complete API documentation
- `backend/TICKET_SYSTEM_README.md` - This file
- `backend/test-tickets.http` - Test file for API endpoints

### Modified Files
- `backend/server.js` - Added ticket routes
- `backend/models/User.js` - Added `role` field

## Testing

Use the provided `test-tickets.http` file to test all endpoints. Make sure to:

1. First login to get a JWT token
2. Replace `{{token}}` with your actual token
3. Use the examples for different ticket types

## Next Steps

After implementing the backend ticket system, you can:

1. **Build the Frontend**
   - Ticket creation form
   - Ticket list view with filters
   - Ticket detail page
   - Comment interface

2. **Add Features**
   - File upload for attachments
   - Email notifications
   - Search functionality
   - Dashboard with statistics
   - Export/print tickets

3. **Integrate with AI Chatbot**
   - Create tickets from chatbot conversations
   - Link chatbot sessions to tickets

## Security Features

✅ JWT-based authentication  
✅ Role-based access control  
✅ Input validation and sanitization  
✅ Error handling with proper HTTP status codes  
✅ Protection against unauthorized access  
✅ Internal notes only visible to staff  

## Error Handling

All endpoints return consistent error responses:
- `400` - Validation errors
- `401` - Authentication required
- `403` - Permission denied
- `404` - Resource not found
- `500` - Server error

## Documentation

For detailed API documentation with examples, see:
- `TICKET_API_DOCUMENTATION.md` - Complete API reference
- `test-tickets.http` - Test examples

## Support

This system is designed to be foolproof and production-ready for university use. All endpoints include:
- Comprehensive validation
- Proper error handling
- Security checks
- Role-based permissions
- Audit trails via system comments

