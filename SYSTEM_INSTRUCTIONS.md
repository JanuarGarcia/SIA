# System Instructions - Complete User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Authentication](#authentication)
5. [Dashboard](#dashboard)
6. [Ticket Management](#ticket-management)
7. [AI Chatbot](#ai-chatbot)
8. [Profile Management](#profile-management)
9. [Admin Features](#admin-features)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

This is a comprehensive University Ticketing System designed for PSU Urdaneta City Campus. The system allows students to create and manage tickets for various university services, while staff and administrators can review, process, and manage these tickets efficiently.

### Key Features
- **User Authentication** - Secure registration and login system
- **Ticket Management** - Create, view, update, and track tickets
- **AI Chatbot** - Interactive assistant for office locations, FAQs, and ticket creation
- **Role-Based Access** - Different permissions for students, staff, and admins
- **Admin Dashboard** - Comprehensive management tools for administrators
- **Analytics** - Statistics and insights for ticket management

---

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Active internet connection
- Valid email address for registration

### Accessing the System
1. Open your web browser
2. Navigate to the system URL (provided by your administrator)
3. You'll see the login page

---

## User Roles

The system has three user roles with different permissions:

### 1. Student
- Create tickets
- View own tickets
- Update own tickets (only if status is Pending or Cancelled)
- Cancel own tickets
- Add comments to own tickets
- View ticket status and updates
- Use AI Chatbot
- Manage own profile

### 2. Staff
- All student permissions
- View all tickets
- Update any ticket
- Change ticket status
- Assign tickets to staff members
- Create internal comments (not visible to students)
- View all comments (including internal)

### 3. Admin
- All staff permissions
- Delete any ticket
- Access admin dashboard
- Manage categories, courses, and office locations
- View analytics and statistics
- Update/delete system notes
- Cannot edit own profile (security measure)

---

## Authentication

### Registration

1. **Navigate to Registration**
   - Click "Sign up here" on the login page
   - Or go directly to `/register`

2. **Fill in Registration Form**
   - **Username** (required): 3-30 characters, letters, numbers, and underscores only
   - **Email** (required): Valid email address
   - **Password** (required): Minimum 8 characters, must contain:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
   - **First Name** (optional): Maximum 50 characters
   - **Last Name** (optional): Maximum 50 characters

3. **Submit Registration**
   - Click "Register" button
   - You'll be automatically logged in after successful registration
   - Default role is "student"

### Login

1. **Enter Credentials**
   - You can login using either:
     - Your **email address**, OR
     - Your **username**
   - Enter your password

2. **Access the System**
   - Click "Login" button
   - You'll be redirected to:
     - **Dashboard** (for students/staff)
     - **Admin Dashboard** (for admins)

### Logout

1. Click on your profile/username in the header
2. Select "Logout" from the dropdown menu
3. You'll be redirected to the login page

### Admin Registration

Admins must be registered using a special endpoint with an admin secret key. Contact your system administrator for admin account creation.

---

## Dashboard

### Student/Staff Dashboard

The dashboard provides an overview of your tickets and quick access to key features:

1. **Ticket Statistics**
   - Total tickets
   - Pending tickets
   - In Review tickets
   - Completed tickets
   - Other status counts

2. **Quick Actions**
   - **Create New Ticket** - Button to create a new ticket
   - **View All Tickets** - Link to see all your tickets
   - **AI Chatbot** - Access the interactive assistant

3. **Recent Tickets**
   - List of your most recent tickets with:
     - Ticket number
     - Title
     - Status
     - Priority
     - Created date

### Admin Dashboard

The admin dashboard provides comprehensive management tools:

1. **Overview Statistics**
   - Total tickets across all users
   - Tickets by status
   - Tickets by category
   - Tickets by priority

2. **Quick Access**
   - **Review Tickets** - Review and process tickets
   - **View All Tickets** - Complete ticket list
   - **Analytics** - Detailed statistics
   - **Category Management** - Manage ticket categories
   - **Course Management** - Manage courses
   - **Office Management** - Manage office locations

---

## Ticket Management

### Creating a Ticket

1. **Access Create Ticket Page**
   - Click "Create Ticket" button on dashboard
   - Or navigate to `/tickets/create`

2. **Fill in Ticket Information**
   - **Title** (required): 5-200 characters
     - Be specific and descriptive
     - Example: "Request for Official Transcript of Records"
   
   - **Description** (required): 10-5000 characters
     - Provide detailed information about your request
     - Include relevant details like student ID, course, etc.
   
   - **Category** (required): Select from dropdown
     - OTR Request
     - Subject Enrollment
     - Grade Inquiry
     - Document Request
     - Enrollment
     - Scholarship
     - Financial Aid
     - Tuition Payment
     - Academic Complaint
     - Course Evaluation
     - Library
     - General Inquiry
     - Technical Support
     - Other (allows custom category)
   
   - **Priority** (optional): Select priority level
     - **Low**: Non-urgent inquiries
     - **Normal**: Standard requests (default)
     - **High**: Important requests (deadlines within 1 week)
     - **Urgent**: Time-sensitive (deadlines within 3 days)
   
   - **Request Details** (optional): Additional information based on category
     - For OTR Requests:
       - Number of copies (1-10)
       - Purpose
       - Delivery method (Pickup, Email, Mail, Digital Download)
       - Student ID
       - Course/Program
       - Year level
     
     - For Subject Enrollment:
       - Subject code
       - Subject name
       - Semester
       - Academic year
       - Student ID
       - Course/Program
       - Year level

3. **Submit Ticket**
   - Click "Create Ticket" button
   - A unique ticket number will be generated (format: TICKET-YYYYMMDD-XXXXX)
   - You'll be redirected to the ticket detail page

### Viewing Tickets

1. **Access Tickets Page**
   - Click "Tickets" in navigation menu
   - Or navigate to `/tickets`

2. **Ticket List Features**
   - **Filters**: Filter by status, category, or priority
   - **Search**: Search by title, description, ticket number, or request details
   - **Sort**: Sort by date, priority, or status
   - **Pagination**: Navigate through multiple pages

3. **Ticket Information Displayed**
   - Ticket number
   - Title
   - Status badge
   - Priority badge
   - Category
   - Created date
   - Last updated date

### Viewing Ticket Details

1. **Open Ticket**
   - Click on any ticket from the list
   - Or navigate to `/tickets/:id`

2. **Ticket Detail Page Shows**
   - Complete ticket information
   - Status and priority
   - Request details
   - Created by information
   - Assigned staff (if applicable)
   - Resolution information (if completed/rejected)
   - All comments and updates
   - Action buttons (based on permissions)

### Updating a Ticket

**Students can update tickets only if:**
- They created the ticket
- Status is "Pending" or "Cancelled"

**Staff/Admin can update any ticket**

1. **Access Update**
   - Click "Edit" button on ticket detail page
   - Or use the update API endpoint

2. **Modify Information**
   - Update title, description, category, priority
   - Modify request details
   - All fields are optional (only provide what you want to change)

3. **Save Changes**
   - Click "Update Ticket" button
   - Changes will be saved and a system note will be created

### Changing Ticket Status

**Only Staff/Admin can change ticket status (except cancellation)**

**Status Workflow:**
1. **Pending** - Initial status when ticket is created
2. **In Review** - Staff is reviewing the request
3. **Approved** - Request approved, processing
4. **Completed** - Successfully completed
5. **Rejected** - Request rejected (with reason)
6. **Cancelled** - Cancelled by student
7. **On Hold** - Temporarily on hold

**To Change Status:**
1. Open ticket detail page
2. Select new status from dropdown
3. Add resolution notes or rejection reason (if applicable)
4. Click "Update Status"

**Students can cancel tickets:**
- Only if status is "Pending" or "In Review"
- Click "Cancel Ticket" button
- Provide cancellation reason (optional)

### Assigning Tickets (Staff/Admin Only)

1. **Open Ticket Detail Page**
2. **Click "Assign Ticket"**
3. **Select Staff Member** from dropdown
4. **Confirm Assignment**
   - Ticket will be assigned to selected staff
   - System note will be created

### Adding Comments

1. **Open Ticket Detail Page**
2. **Scroll to Comments Section**
3. **Enter Comment**
   - Type your message (1-2000 characters)
   - For staff/admin: Check "Internal Note" to make it staff-only
4. **Submit Comment**
   - Click "Add Comment" button
   - Comment will appear in the thread

**Comment Rules:**
- Students can only see public comments
- Staff/Admin can see all comments (including internal)
- Students cannot comment on closed tickets (Completed, Rejected, Cancelled)
- Only author or admin can edit/delete comments

### Deleting Tickets

**Students can delete tickets only if:**
- They created the ticket
- Status is "Pending"

**Admins can delete any ticket**

1. **Open Ticket Detail Page**
2. **Click "Delete Ticket"** button
3. **Confirm Deletion**
   - Ticket and all associated comments will be permanently deleted

---

## AI Chatbot

The AI Chatbot is an intelligent assistant that can help with various tasks:

### Accessing the Chatbot

1. **Open Chatbot**
   - Click "Chatbot" button in navigation menu
   - Or access from dashboard

2. **Chat Interface**
   - Message input at the bottom
   - Chat history displayed above
   - Send button to submit messages

### Chatbot Capabilities

#### 1. Greetings
- Responds to greetings in English and Tagalog
- Provides time-appropriate greetings (Good morning/afternoon/evening)
- Lists available services

**Example:**
- "Hello"
- "Hi there"
- "Good morning"

#### 2. Office Location Inquiries
- Find office locations on campus
- Supports English and Tagalog queries
- Provides building, floor, and room information

**Examples:**
- "Where is the Registrar?"
- "Saan ang Library?"
- "Where can I find the Cashier?"
- "Location of Engineering Department"

#### 3. FAQ Responses
- Answers frequently asked questions
- Matches questions based on keywords
- Provides detailed answers

**Example:**
- "How do I request an OTR?"
- "What documents do I need for enrollment?"

#### 4. Ticket Status Inquiries
- Check your ticket status
- View all your tickets
- Get details about specific tickets

**Examples:**
- "Check my ticket status"
- "Show my tickets"
- "What is the status of ticket TICKET-20241201-ABC12?"

#### 5. Ticket Creation Assistance
- Helps create tickets from conversations
- Detects ticket category from your message
- Offers to create tickets automatically

**How it works:**
1. Describe your request in natural language
2. Chatbot detects if you need a ticket
3. Offers to create a ticket
4. Reply "yes" or "create ticket" to confirm
5. Ticket is automatically created

**Examples:**
- "I need an official transcript"
- "I want to enroll in CS 401"
- "I have a question about my grade"

#### 6. General Inquiries
- Answers general questions about university services
- Provides information about departments
- Guides you to appropriate resources

### Chatbot Tips

1. **Be Specific**: Provide clear details for better assistance
2. **Use Natural Language**: Chatbot understands conversational language
3. **Ask Follow-ups**: You can ask multiple questions in sequence
4. **Ticket Creation**: Always confirm before creating tickets
5. **Bilingual Support**: Works in both English and Tagalog

### Chatbot Limitations

- Cannot process file uploads
- Cannot access external systems
- Responses are based on available data
- May need clarification for complex requests

---

## Profile Management

### Viewing Profile

1. **Access Profile**
   - Click on your username in the header
   - Select "Profile" from dropdown
   - Or navigate to `/profile`

2. **Profile Information Displayed**
   - Username
   - Email
   - First Name
   - Last Name
   - Role
   - Account creation date
   - Last login date

### Updating Profile

**Note: Admins cannot edit their profiles (security measure)**

1. **Click "Edit Profile"**
2. **Update Information**
   - Username (must be unique)
   - Email (must be unique)
   - First Name
   - Last Name
3. **Save Changes**
   - Click "Update Profile" button
   - Changes will be saved immediately

### Changing Password

**Note: Admins cannot change their passwords (security measure)**

1. **Click "Change Password"**
2. **Enter Current Password**
3. **Enter New Password**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and number
4. **Confirm New Password**
5. **Save Changes**
   - Click "Change Password" button
   - You'll need to login again with new password

### Deleting Account

**Note: Admins cannot delete their accounts (security measure)**

1. **Click "Delete Account"**
2. **Enter Password** to confirm
3. **Confirm Deletion**
   - Warning: This action cannot be undone
   - All your tickets and data will be deleted
4. **Account Deleted**
   - You'll be logged out automatically

---

## Admin Features

### Admin Dashboard Overview

The admin dashboard provides comprehensive management tools:

1. **Ticket Management**
   - Review all tickets
   - Update ticket status
   - Add remarks
   - Assign tickets
   - Delete tickets

2. **Analytics**
   - Ticket statistics
   - Category breakdown
   - Priority distribution
   - Time-based trends

3. **Data Management**
   - Category management
   - Course management
   - Office location management

### Ticket Review

1. **Access Ticket Review**
   - Click "Review Tickets" on admin dashboard
   - Or navigate to `/admin/tickets`

2. **Review Interface**
   - List of all tickets with filters
   - Search functionality
   - Sort options
   - Pagination

3. **Reviewing a Ticket**
   - Click on any ticket to open detail view
   - View complete ticket information
   - See all comments (including internal)
   - Update status
   - Add remarks
   - Assign to staff
   - Delete ticket (if needed)

4. **Updating Ticket Status**
   - Select status: Pending, In Review, or Completed
   - Add remarks (optional)
   - Save changes

5. **Adding Remarks**
   - Type remarks in the remarks field
   - Remarks are visible to students
   - Click "Add Remark" to save

### Analytics Dashboard

1. **Access Analytics**
   - Click "Analytics" on admin dashboard
   - Or navigate to `/admin/analytics`

2. **Available Statistics**
   - **Total Tickets**: Count of all tickets
   - **By Status**: Breakdown by ticket status
   - **By Category**: Tickets grouped by category
   - **By Priority**: Distribution by priority level
   - **Time Trends**: Tickets created over time (last 30 days)
   - **Response Times**: Average time to first response
   - **Completion Rates**: Percentage of completed tickets

3. **Using Analytics**
   - View charts and graphs
   - Export data (if available)
   - Filter by date range
   - Identify trends and patterns

### Category Management

1. **Access Category Management**
   - Click "Category Management" on admin dashboard
   - Or navigate to `/admin/categories`

2. **View Categories**
   - List of all available ticket categories
   - Shows category name and usage count

3. **Add New Category**
   - Click "Add Category" button
   - Enter category name
   - Click "Save"
   - Category will be available for ticket creation

4. **Update Category**
   - Click "Edit" on any category
   - Modify category name
   - Click "Update"
   - All tickets using this category will be updated

5. **Delete Category**
   - Click "Delete" on any category
   - Confirm deletion
   - **Warning**: Only delete if no tickets are using this category

### Course Management

1. **Access Course Management**
   - Click "Course Management" on admin dashboard
   - Or navigate to `/admin/courses`

2. **View Courses**
   - List of all available courses
   - Shows course name and code

3. **Add New Course**
   - Click "Add Course" button
   - Enter course name
   - Enter course code (optional)
   - Click "Save"

4. **Update Course**
   - Click "Edit" on any course
   - Modify course information
   - Click "Update"

5. **Delete Course**
   - Click "Delete" on any course
   - Confirm deletion

### Office Location Management

1. **Access Office Management**
   - Click "Office Management" on admin dashboard
   - Or navigate to `/admin/offices`

2. **View Offices**
   - List of all office locations
   - Shows office name, building, and location

3. **Add New Office**
   - Click "Add Office" button
   - Fill in information:
     - Office name (English)
     - Office name (Tagalog) - optional
     - Building name
     - Floor/Room
     - Description
     - Keywords (for chatbot matching)
   - Click "Save"

4. **Update Office**
   - Click "Edit" on any office
   - Modify office information
   - Click "Update"

5. **Delete Office**
   - Click "Delete" on any office
   - Confirm deletion

**Office Information Fields:**
- **Office Name**: English name of the office
- **Office Name (Tagalog)**: Tagalog name for bilingual support
- **Building Name**: Name of the building
- **Floor/Room**: Specific location (e.g., "2nd Floor, Room 201")
- **Description**: Additional information about the office
- **Keywords**: Words that help chatbot identify this office

---

## Troubleshooting

### Common Issues

#### 1. Cannot Login
**Possible Causes:**
- Incorrect email/username or password
- Account is deactivated
- Browser cache issues

**Solutions:**
- Verify credentials
- Try password reset (if available)
- Clear browser cache
- Contact administrator

#### 2. Cannot Create Ticket
**Possible Causes:**
- Missing required fields
- Validation errors
- Network issues

**Solutions:**
- Check all required fields are filled
- Verify field lengths meet requirements
- Check internet connection
- Try refreshing the page

#### 3. Cannot Update Ticket
**Possible Causes:**
- Insufficient permissions
- Ticket status doesn't allow updates
- Ticket doesn't belong to you

**Solutions:**
- Check if you're the ticket creator
- Verify ticket status (must be Pending or Cancelled for students)
- Contact staff/admin if you need assistance

#### 4. Chatbot Not Responding
**Possible Causes:**
- Network issues
- API service unavailable
- Invalid message format

**Solutions:**
- Check internet connection
- Try rephrasing your question
- Refresh the page
- Contact support if issue persists

#### 5. Cannot Access Admin Features
**Possible Causes:**
- Not logged in as admin
- Session expired
- Permission issues

**Solutions:**
- Verify you're logged in with admin account
- Logout and login again
- Contact system administrator

### Getting Help

If you encounter issues not covered here:

1. **Check Documentation**
   - Review this guide
   - Check FAQ section

2. **Contact Support**
   - Email: [Support Email]
   - Phone: [Support Phone]
   - Office Hours: [Hours]

3. **Create a Ticket**
   - Use the "Technical Support" category
   - Provide detailed description of the issue
   - Include screenshots if possible

---

## Best Practices

### For Students

1. **Creating Tickets**
   - Provide clear, detailed descriptions
   - Include all relevant information (student ID, course, etc.)
   - Use appropriate priority levels
   - Attach documents if needed

2. **Following Up**
   - Check ticket status regularly
   - Add comments for additional information
   - Respond to staff inquiries promptly

3. **Using Chatbot**
   - Be specific in your questions
   - Use natural language
   - Confirm before creating tickets

### For Staff

1. **Processing Tickets**
   - Review tickets promptly
   - Update status regularly
   - Add clear remarks
   - Assign tickets appropriately

2. **Communication**
   - Use public comments for student communication
   - Use internal notes for staff discussions
   - Provide clear resolution notes

3. **Organization**
   - Use filters to manage workload
   - Prioritize urgent tickets
   - Keep tickets updated

### For Admins

1. **System Management**
   - Regularly review analytics
   - Keep categories and courses updated
   - Maintain office location information
   - Monitor system performance

2. **Data Maintenance**
   - Update categories as needed
   - Keep course list current
   - Maintain accurate office locations
   - Review and clean up old data

3. **User Management**
   - Monitor user activity
   - Handle support requests
   - Maintain system security

---

## Security Notes

1. **Password Security**
   - Use strong, unique passwords
   - Don't share your password
   - Change password regularly
   - Don't use the same password for multiple accounts

2. **Account Security**
   - Logout when finished
   - Don't share your account
   - Report suspicious activity
   - Keep your email updated

3. **Data Privacy**
   - Only view your own tickets (as student)
   - Don't share ticket information publicly
   - Respect privacy of other users
   - Follow university data policies

---

## System Requirements

### Browser Compatibility
- Chrome (latest version)
- Firefox (latest version)
- Edge (latest version)
- Safari (latest version)

### Network Requirements
- Stable internet connection
- Minimum 1 Mbps download speed
- JavaScript enabled
- Cookies enabled

### Screen Resolution
- Minimum: 1024x768
- Recommended: 1920x1080 or higher
- Mobile responsive design supported

---

## Glossary

- **Ticket**: A request or inquiry submitted by a user
- **Status**: Current state of a ticket (Pending, In Review, etc.)
- **Priority**: Importance level of a ticket (Low, Normal, High, Urgent)
- **Category**: Type of request (OTR Request, Subject Enrollment, etc.)
- **OTR**: Official Transcript of Records
- **Internal Note**: Comment visible only to staff/admin
- **System Note**: Automated comment created by the system
- **Assigned To**: Staff member responsible for handling the ticket
- **Resolution**: Final outcome of a ticket (completed or rejected)

---

## Version Information

- **System Version**: 1.0
- **Last Updated**: [Date]
- **Documentation Version**: 1.0

---

## Contact Information

For questions, issues, or feedback:

- **System Administrator**: [Email]
- **Support Team**: [Email]
- **Office Location**: [Address]
- **Phone**: [Phone Number]
- **Hours**: [Operating Hours]

---

*This documentation is maintained by the system administration team. For updates or corrections, please contact the administrator.*

