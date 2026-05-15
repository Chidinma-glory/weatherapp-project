// ============================================
// WEATHER FORECAST APP - MAIN SERVER FILE
// This file initializes and starts the Express server
// ============================================

// Load environment variables from .env file
require('dotenv').config();

// Import Express and other modules
const express = require('express');
const cors = require('cors');

// Import Express configuration and routes from express.js file
const { router, corsOptions } = require('./express');

// ============================================
// INITIALIZE EXPRESS APP
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// APPLY MIDDLEWARE
// ============================================

// Enable CORS
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// MOUNT API ROUTES
// ============================================

// Mount all API routes under /api prefix
app.use('/api', router);

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Weather Forecast API',
        documentation: '/api/info',
        health: '/api/health',
        example: '/api/weather/London'
    });
});

// ============================================
// 404 HANDLER FOR UNDEFINED ROUTES
// ============================================

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        availableEndpoints: ['/api/weather/:city', '/api/health', '/api/info', '/api/weather/forecast/:city']
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on the server'
    });
});

// ============================================
// START THE SERVER
// ============================================

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('🌤️  WEATHER FORECAST BACKEND SERVER');
    console.log('========================================');
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log(`📍 Weather endpoint: http://localhost:${PORT}/api/weather/{city}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`ℹ️  API info: http://localhost:${PORT}/api/info`);
    console.log('========================================\n');
    
    // Check API key status
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        console.log('⚠️  WARNING: API key not configured!');
        console.log('📝 Please edit the .env file and add your WeatherAPI.com key');
        console.log('🔗 Get a free key at: https://www.weatherapi.com/signup.aspx\n');
    } else {
        console.log('🔑 API Key: ✓ Configured successfully\n');
    }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Server terminated...');
    process.exit(0);
});

// Export app for testing
module.exports = app;