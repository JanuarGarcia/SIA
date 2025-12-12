# Quick Start Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB running on your system
- npm or yarn

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-chatbot-ticketing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Client Setup

Open a new terminal:

```bash
cd client
npm install
```

Start the client server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The client will run on `http://localhost:3000`

### 3. Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the login page
3. Click "Sign up here" to create a new account
4. After registration, you'll be automatically logged in and redirected to the dashboard
5. You can logout from the dashboard

## Features

- ✅ User Registration with validation
- ✅ User Login (email or username)
- ✅ User Logout
- ✅ Protected routes
- ✅ Beautiful UI with Royal Blue (#4169E1) and Royal Yellow (#F5A623) theme
- ✅ Responsive design

## Troubleshooting

### Backend won't start
- Make sure MongoDB is running
- Check that the port 5000 is not already in use
- Verify your `.env` file is correctly configured

### Client won't start
- Make sure port 3000 is not already in use
- Verify all dependencies are installed (`npm install`)
- Check that the backend is running on port 5000

### CORS errors
- Make sure the backend server is running
- Check that CORS is enabled in the backend (it should be by default)

## Next Steps

After authentication is working, you can proceed to build:
- AI Chatbot interface
- Ticket creation and management
- User dashboard enhancements

