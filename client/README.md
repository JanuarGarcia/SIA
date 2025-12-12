# AI Chatbot & Ticketing System - Client

Frontend application for the AI Chatbot and Ticketing System with authentication features.

## Features

- User Registration with validation
- User Login (email or username)
- User Logout
- Protected routes
- Beautiful UI with Royal Blue and Royal Yellow theme
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure the backend server is running on port 5000.

3. Start the client server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Development

For development with hot-reload:
```bash
npm run dev
```

## Project Structure

```
client/
├── app.js                 # Express server to serve the React app
├── webpack.config.js      # Webpack configuration
├── public/
│   └── index.html         # HTML template
└── src/
    ├── index.js           # React entry point
    ├── App.js             # Main App component with routing
    ├── controllers/       # API controllers
    │   └── authController.js
    ├── context/           # React Context
    │   └── AuthContext.js
    ├── components/        # Reusable components
    │   └── PrivateRoute.js
    ├── pages/             # Page components
    │   ├── Login.js
    │   ├── Register.js
    │   └── Dashboard.js
    └── styles/            # CSS files
        ├── index.css
        ├── App.css
        ├── Auth.css
        └── Dashboard.css
```

## Color Scheme

- **Royal Blue**: #4169E1
- **Royal Yellow**: #F5A623

## Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)
- `/` - Redirects to `/dashboard`

