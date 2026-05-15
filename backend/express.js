// ============================================
// EXPRESS.JS CONFIGURATION FILE
// This file contains all Express setup, middleware, and routes
// ============================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Create Express router instance
const router = express.Router();

// ============================================
// WEATHER API CONFIGURATION
// ============================================

// Get API key from environment variables
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'YOUR_API_KEY_HERE';
const WEATHER_API_BASE_URL = 'http://api.weatherapi.com/v1';

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Configure CORS for frontend access
const corsOptions = {
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// ============================================
// WEATHER ROUTES
// ============================================

/**
 * Route: GET /api/weather/:city
 * Fetches current weather data for a specific city
 */
router.get('/weather/:city', async (req, res) => {
    const { city } = req.params;
    
    // Validate city parameter
    if (!city || city.trim() === '') {
        return res.status(400).json({ 
            error: 'City name is required',
            message: 'Please provide a valid city name'
        });
    }

    // Sanitize city name
    const sanitizedCity = city.trim().replace(/[^a-zA-Z\s\-]/g, '');
    
    if (sanitizedCity.length === 0) {
        return res.status(400).json({ 
            error: 'Invalid city name',
            message: 'Please enter a valid city name containing only letters'
        });
    }

    try {
        console.log(`🌤️  Fetching weather data for: ${sanitizedCity}`);
        
        // Make request to WeatherAPI.com
        const response = await axios.get(`${WEATHER_API_BASE_URL}/current.json`, {
            params: {
                key: WEATHER_API_KEY,
                q: sanitizedCity,
                aqi: 'no'
            },
            timeout: 10000
        });

        // Extract and format weather data
        const weatherData = {
            success: true,
            city: response.data.location.name,
            country: response.data.location.country,
            localTime: response.data.location.localtime,
            temperature: Math.round(response.data.current.temp_c),
            temperatureF: Math.round(response.data.current.temp_f),
            condition: response.data.current.condition.text,
            conditionCode: response.data.current.condition.code,
            humidity: response.data.current.humidity,
            windSpeed: Math.round(response.data.current.wind_kph),
            windDirection: response.data.current.wind_dir,
            feelsLike: Math.round(response.data.current.feelslike_c),
            uvIndex: response.data.current.uv,
            cloudCover: response.data.current.cloud,
            iconUrl: `https:${response.data.current.condition.icon}`,
            lastUpdated: response.data.current.last_updated
        };

        console.log(`✅ Weather data sent for: ${weatherData.city}`);
        res.json(weatherData);

    } catch (error) {
        console.error(`❌ Error:`, error.message);
        
        // Handle specific error types
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ 
                error: 'Request timeout',
                message: 'Weather service is taking too long. Please try again.'
            });
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'Network error',
                message: 'Cannot connect to weather service. Check your internet connection.'
            });
        }
        
        if (error.response?.status === 400) {
            return res.status(404).json({ 
                error: 'City not found',
                message: `"${sanitizedCity}" was not found. Please check spelling.`
            });
        }
        
        if (error.response?.status === 401) {
            return res.status(500).json({ 
                error: 'API key error',
                message: 'Weather service authentication failed. Please check your API key.'
            });
        }
        
        res.status(500).json({ 
            error: 'Service error',
            message: 'Unable to fetch weather data. Please try again later.'
        });
    }
});

/**
 * Route: GET /api/weather/forecast/:city
 * Fetches 3-day weather forecast (bonus feature)
 */
router.get('/weather/forecast/:city', async (req, res) => {
    const { city } = req.params;
    const { days = 3 } = req.query;
    
    if (!city || city.trim() === '') {
        return res.status(400).json({ error: 'City name is required' });
    }

    try {
        const response = await axios.get(`${WEATHER_API_BASE_URL}/forecast.json`, {
            params: {
                key: WEATHER_API_KEY,
                q: city.trim(),
                days: Math.min(days, 5),
                aqi: 'no'
            },
            timeout: 10000
        });

        const forecast = response.data.forecast.forecastday.map(day => ({
            date: day.date,
            maxTemp: Math.round(day.day.maxtemp_c),
            minTemp: Math.round(day.day.mintemp_c),
            condition: day.day.condition.text,
            iconUrl: `https:${day.day.condition.icon}`,
            chanceOfRain: day.day.daily_chance_of_rain
        }));

        res.json({
            success: true,
            city: response.data.location.name,
            country: response.data.location.country,
            forecast: forecast
        });
    } catch (error) {
        res.status(500).json({ error: 'Unable to fetch forecast data' });
    }
});

/**
 * Route: GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Weather backend server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Route: GET /api/info
 * API information endpoint
 */
router.get('/info', (req, res) => {
    res.json({
        name: 'Weather Forecast API',
        version: '1.0.0',
        description: 'Backend API for real-time weather data',
        endpoints: [
            { method: 'GET', path: '/api/weather/:city', description: 'Get current weather' },
            { method: 'GET', path: '/api/weather/forecast/:city', description: 'Get weather forecast' },
            { method: 'GET', path: '/api/health', description: 'Check server health' },
            { method: 'GET', path: '/api/info', description: 'Get API information' }
        ]
    });
});

// ============================================
// EXPORT EXPRESS ROUTER
// ============================================

module.exports = {
    router,
    corsOptions
};