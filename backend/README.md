# Authentication Backend

A secure authentication system built with Node.js, Express, and MongoDB using Mongoose.

## Features

- User registration with validation
- User login with email or username
- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Error handling
- Token verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-chatbot-ticketing
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Make sure MongoDB is running on your system.

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

### POST /api/auth/login
Login with email or username.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
OR
```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

### POST /api/auth/logout
Logout (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful. Please remove the token from client storage."
}
```

### GET /api/auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

### POST /api/auth/verify-token
Verify if a token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

## Security Features

- Passwords are hashed using bcrypt with salt rounds of 12
- JWT tokens for stateless authentication
- Input validation and sanitization
- Password requirements: minimum 8 characters, at least one uppercase, one lowercase, and one number
- Username validation: only letters, numbers, and underscores
- Email validation
- Token expiration handling

