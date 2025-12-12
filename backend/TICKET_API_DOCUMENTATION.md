# Ticket System API Documentation

This document provides comprehensive documentation for the University Ticketing System API, designed for requests like OTR (Official Transcript of Records) and Subject Enrollment.

## Base URL
```
http://localhost:5000/api/tickets
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Table of Contents
1. [Create a Ticket](#create-a-ticket)
2. [Get All Tickets](#get-all-tickets)
3. [Get Ticket Statistics](#get-ticket-statistics)
4. [Get Single Ticket](#get-single-ticket)
5. [Update Ticket](#update-ticket)
6. [Update Ticket Status](#update-ticket-status)
7. [Assign Ticket](#assign-ticket)
8. [Delete Ticket](#delete-ticket)
9. [Ticket Comments](#ticket-comments)

---

## Create a Ticket

### POST /api/tickets

Create a new ticket for various university requests.

#### Request Body

**Basic Fields:**
- `title` (required): Ticket title (5-200 characters)
- `description` (required): Detailed description (10-5000 characters)
- `category` (required): One of the categories listed below
- `priority` (optional): `Low`, `Normal`, `High`, or `Urgent` (default: `Normal`)
- `requestDetails` (optional): Additional details based on request type

#### Categories
- `OTR Request` - Official Transcript of Records
- `Subject Enrollment` - Adding/Dropping subjects
- `Grade Inquiry` - Questioning grades
- `Document Request` - Various document requests
- `Enrollment` - General enrollment issues
- `Scholarship` - Scholarship applications/inquiries
- `Financial Aid` - Financial aid requests
- `Tuition Payment` - Payment-related issues
- `Academic Complaint` - Academic grievances
- `Course Evaluation` - Course/teacher evaluation
- `Library` - Library services
- `General Inquiry` - General questions
- `Technical Support` - System/technical issues
- `Other` - Other requests

#### Example 1: OTR Request

```json
{
  "title": "Request for Official Transcript of Records",
  "description": "I need an official transcript of records for my graduate school application. I require 3 copies delivered via email.",
  "category": "OTR Request",
  "priority": "High",
  "requestDetails": {
    "numberOfCopies": 3,
    "purpose": "Graduate school application",
    "deliveryMethod": "Email",
    "studentId": "2020-12345",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "4th Year"
  }
}
```

#### Example 2: Subject Enrollment

```json
{
  "title": "Request to Enroll in Advanced Database Systems",
  "description": "I would like to enroll in CS 401 - Advanced Database Systems for the Fall 2024 semester. I have completed all prerequisites.",
  "category": "Subject Enrollment",
  "priority": "Normal",
  "requestDetails": {
    "subjectCode": "CS 401",
    "subjectName": "Advanced Database Systems",
    "semester": "Fall",
    "academicYear": "2024-2025",
    "studentId": "2020-12345",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "3rd Year"
  }
}
```

#### Example 3: Grade Inquiry

```json
{
  "title": "Inquiry about Final Grade in Data Structures",
  "description": "I would like to inquire about my final grade in CS 201 - Data Structures. I believe there may be an error in the calculation.",
  "category": "Grade Inquiry",
  "priority": "Normal",
  "requestDetails": {
    "subjectCode": "CS 201",
    "subjectName": "Data Structures",
    "studentId": "2020-12345",
    "semester": "Spring",
    "academicYear": "2023-2024"
  }
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "ticket": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "ticketNumber": "TICKET-20241201-ABC12",
      "title": "Request for Official Transcript of Records",
      "description": "...",
      "category": "OTR Request",
      "status": "Pending",
      "priority": "High",
      "createdBy": {
        "_id": "...",
        "username": "john_doe",
        "email": "john@university.edu"
      },
      "requestDetails": { ... },
      "createdAt": "2024-12-01T10:30:00.000Z",
      "updatedAt": "2024-12-01T10:30:00.000Z"
    }
  }
}
```

---

## Get All Tickets

### GET /api/tickets

Get a list of tickets with optional filtering and pagination.

#### Query Parameters

- `status` (optional): Filter by status (`Pending`, `In Review`, `Approved`, `Rejected`, `Completed`, `Cancelled`, `On Hold`)
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority (`Low`, `Normal`, `High`, `Urgent`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Sort field (`createdAt`, `updatedAt`, `priority`, `status`)
- `sortOrder` (optional): Sort order (`asc` or `desc`, default: `desc`)

#### Example Request

```
GET /api/tickets?status=Pending&category=OTR Request&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "_id": "...",
        "ticketNumber": "TICKET-20241201-ABC12",
        "title": "...",
        "status": "Pending",
        "category": "OTR Request",
        "priority": "High",
        "createdBy": { ... },
        "assignedTo": null,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

**Note:** Students can only see their own tickets. Staff and admins can see all tickets.

---

## Get Ticket Statistics

### GET /api/tickets/stats

Get ticket statistics (counts by status, category, etc.)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "statistics": {
      "total": 15,
      "pending": 5,
      "inReview": 3,
      "approved": 2,
      "completed": 4,
      "rejected": 1,
      "byCategory": [
        { "_id": "OTR Request", "count": 8 },
        { "_id": "Subject Enrollment", "count": 5 },
        { "_id": "Grade Inquiry", "count": 2 }
      ]
    }
  }
}
```

---

## Get Single Ticket

### GET /api/tickets/:id

Get detailed information about a specific ticket, including comments.

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "...",
      "ticketNumber": "TICKET-20241201-ABC12",
      "title": "...",
      "description": "...",
      "category": "OTR Request",
      "status": "In Review",
      "priority": "High",
      "createdBy": { ... },
      "assignedTo": { ... },
      "requestDetails": { ... },
      "resolution": {
        "resolvedBy": null,
        "resolvedAt": null,
        "resolutionNotes": null,
        "rejectionReason": null
      },
      "createdAt": "...",
      "updatedAt": "...",
      "firstResponseAt": "...",
      "closedAt": null
    },
    "comments": [
      {
        "_id": "...",
        "content": "Ticket created: Request for Official Transcript of Records",
        "author": { ... },
        "isSystemNote": true,
        "createdAt": "..."
      }
    ]
  }
}
```

**Note:** Students can only view their own tickets. Staff can view tickets assigned to them or all tickets.

---

## Update Ticket

### PUT /api/tickets/:id

Update ticket information.

**Rules:**
- Students can only update their own tickets that are in `Pending` or `Cancelled` status
- Staff/Admin can update any ticket

#### Request Body

Same structure as creating a ticket, but all fields are optional.

#### Example Request

```json
{
  "description": "Updated description - I now need 5 copies instead of 3",
  "requestDetails": {
    "numberOfCopies": 5
  }
}
```

---

## Update Ticket Status

### PUT /api/tickets/:id/status

Update the status of a ticket.

**Rules:**
- Only staff/admin can change status (except cancellation)
- Students can cancel their own tickets if status is `Pending` or `In Review`

#### Request Body

```json
{
  "status": "Approved",
  "resolutionNotes": "Request approved. Processing will take 3-5 business days.",
  "rejectionReason": null
}
```

**For Rejection:**
```json
{
  "status": "Rejected",
  "rejectionReason": "Missing required documents. Please submit your student ID and application form."
}
```

#### Status Workflow

1. `Pending` → Initial status when ticket is created
2. `In Review` → Staff is reviewing the request
3. `Approved` → Request approved, processing
4. `Completed` → Successfully completed
5. `Rejected` → Request rejected (with reason)
6. `Cancelled` → Cancelled by student
7. `On Hold` → Temporarily on hold (awaiting additional information)

---

## Assign Ticket

### PUT /api/tickets/:id/assign

Assign a ticket to a staff member (Staff/Admin only).

#### Request Body

```json
{
  "assignedTo": "65a1b2c3d4e5f6g7h8i9j0k2"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Ticket assigned successfully",
  "data": {
    "ticket": {
      "assignedTo": {
        "_id": "...",
        "username": "staff_member",
        "email": "staff@university.edu"
      },
      ...
    }
  }
}
```

---

## Delete Ticket

### DELETE /api/tickets/:id

Delete a ticket.

**Rules:**
- Students can only delete their own tickets with `Pending` status
- Admins can delete any ticket

---

## Ticket Comments

### POST /api/tickets/:ticketId/comments

Add a comment to a ticket.

#### Request Body

```json
{
  "content": "I have submitted all required documents via email.",
  "isInternal": false
}
```

**Note:** `isInternal: true` can only be used by staff/admin. Internal comments are not visible to students.

#### Example - Staff Internal Comment

```json
{
  "content": "Verified student records. All requirements met.",
  "isInternal": true
}
```

### GET /api/tickets/:ticketId/comments

Get all comments for a ticket.

**Note:** Students cannot see internal comments.

### PUT /api/tickets/:ticketId/comments/:commentId

Update a comment (only author or admin can update).

### DELETE /api/tickets/:ticketId/comments/:commentId

Delete a comment (only author or admin can delete).

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Title must be between 5 and 200 characters",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided. Authorization denied."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. You can only view your own tickets."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Ticket not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating ticket"
}
```

---

## Complete Workflow Example

### Student Creates OTR Request

1. **Create Ticket**
   ```bash
   POST /api/tickets
   {
     "title": "Request for Official Transcript of Records",
     "description": "I need 2 copies of my official transcript for job application.",
     "category": "OTR Request",
     "priority": "High",
     "requestDetails": {
       "numberOfCopies": 2,
       "purpose": "Job application",
       "deliveryMethod": "Email",
       "studentId": "2020-12345"
     }
   }
   ```

2. **Check Status**
   ```bash
   GET /api/tickets/{ticketId}
   ```

3. **Add Follow-up Comment**
   ```bash
   POST /api/tickets/{ticketId}/comments
   {
     "content": "I have completed the online application form. Waiting for approval."
   }
   ```

### Staff Processes Request

1. **View All Pending Tickets**
   ```bash
   GET /api/tickets?status=Pending&category=OTR Request
   ```

2. **Assign to Staff**
   ```bash
   PUT /api/tickets/{ticketId}/assign
   {
     "assignedTo": "{staffUserId}"
   }
   ```

3. **Change Status to In Review**
   ```bash
   PUT /api/tickets/{ticketId}/status
   {
     "status": "In Review"
   }
   ```

4. **Add Internal Note**
   ```bash
   POST /api/tickets/{ticketId}/comments
   {
     "content": "Documents verified. Processing transcript.",
     "isInternal": true
   }
   ```

5. **Approve Request**
   ```bash
   PUT /api/tickets/{ticketId}/status
   {
     "status": "Approved",
     "resolutionNotes": "Transcript will be ready in 3-5 business days."
   }
   ```

6. **Complete Request**
   ```bash
   PUT /api/tickets/{ticketId}/status
   {
     "status": "Completed",
     "resolutionNotes": "Transcript sent via email on December 5, 2024."
   }
   ```

---

## Request Details Fields Reference

### For OTR Requests
- `numberOfCopies` (1-10): Number of transcript copies needed
- `purpose`: Purpose of the request
- `deliveryMethod`: `Pickup`, `Email`, `Mail`, or `Digital Download`
- `studentId`: Student ID number
- `course`: Course/Program name
- `yearLevel`: `1st Year`, `2nd Year`, `3rd Year`, `4th Year`, `5th Year`, `Graduate`, or `Other`

### For Subject Enrollment
- `subjectCode`: Course code (e.g., "CS 401")
- `subjectName`: Full course name
- `semester`: Semester name (e.g., "Fall", "Spring")
- `academicYear`: Academic year (e.g., "2024-2025")
- `studentId`: Student ID number
- `course`: Course/Program name
- `yearLevel`: Current year level

### Common Fields
- `studentId`: Student ID (recommended for all requests)
- `course`: Course/Program (recommended for all requests)
- `yearLevel`: Year level (optional)

---

## Best Practices

1. **Always include studentId** in `requestDetails` for verification
2. **Use appropriate priority levels**: 
   - `Urgent`: Time-sensitive requests (deadlines within 3 days)
   - `High`: Important requests (deadlines within 1 week)
   - `Normal`: Standard requests (default)
   - `Low`: Non-urgent inquiries
3. **Provide detailed descriptions** to help staff process requests faster
4. **Use comments** for follow-up information rather than creating new tickets
5. **Check ticket status regularly** for updates

---

## Testing

You can test the API using tools like:
- Postman
- cURL
- The provided `test-tickets.http` file (if created)

Example cURL command:

```bash
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Request for Official Transcript",
    "description": "I need 2 copies of my transcript",
    "category": "OTR Request",
    "requestDetails": {
      "numberOfCopies": 2,
      "deliveryMethod": "Email",
      "studentId": "2020-12345"
    }
  }'
```

