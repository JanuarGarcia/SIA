const express = require('express');
const path = require('path');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('./webpack.config');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API proxy to backend (optional - you can also configure CORS on backend)
app.use('/api', (req, res, next) => {
  // In production, you might want to proxy requests to backend
  // For now, we'll let the frontend make direct requests
  next();
});

// Webpack configuration for development
if (process.env.NODE_ENV !== 'production') {
  const compiler = webpack(webpackConfig);
  
  // Use webpack dev middleware
  const webpackMiddleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {
      colors: true,
      chunks: false,
    },
    writeToDisk: false,
  });
  
  // Apply webpack middleware to ALL requests first
  // It will handle bundle.js and other assets, and pass through other routes
  app.use(webpackMiddleware);

  // Wait for webpack to finish initial compilation
  compiler.hooks.done.tap('done', () => {
    console.log('Webpack compilation complete');
  });
} else {
  // Serve static files from dist directory in production
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Serve index.html for all routes (SPA routing)
// This MUST be the absolute last route handler
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Skip if response was already sent (by webpack for assets)
  if (res.headersSent) {
    return;
  }
  
  // Check if it's a file request (has extension)
  // These should be handled by webpack or static, so let them 404 if not found
  if (/\.[^/]+$/.test(req.path)) {
    return next();
  }
  
  // For all SPA routes, serve index.html
  const filePath = process.env.NODE_ENV !== 'production'
    ? path.join(__dirname, 'public', 'index.html')
    : path.join(__dirname, 'dist', 'index.html');
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending index.html for path:', req.path, err);
      res.status(500).send('Error loading page');
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Client server running on http://localhost:${PORT}`);
  console.log(`📡 Make sure the backend server is running on port 5000\n`);
});

