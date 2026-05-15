// ============================================
// WEATHER FORECAST APP - FRONTEND JAVASCRIPT
// ============================================

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const REQUEST_TIMEOUT = 15000; // 15 seconds

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherContent = document.getElementById('weatherContent');
const welcomeMessage = document.getElementById('welcomeMessage');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Weather display elements
const cityNameEl = document.getElementById('cityName');
const countryNameEl = document.getElementById('countryName');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const weatherIconEl = document.getElementById('weatherIcon');

// Timeout function for fetch requests
function timeoutPromise(ms, promise) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timeout - Please check your connection'));
        }, ms);
        
        promise.then(
            (res) => {
                clearTimeout(timeoutId);
                resolve(res);
            },
            (err) => {
                clearTimeout(timeoutId);
                reject(err);
            }
        );
    });
}

// Fetch weather data from backend
async function fetchWeather(city) {
    // Show loading spinner and hide other content
    loadingSpinner.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    welcomeMessage.classList.add('hidden');
    hideError();

    try {
        // Encode city name for URL safety
        const encodedCity = encodeURIComponent(city.trim());
        
        // Make request to backend with timeout
        const response = await timeoutPromise(
            REQUEST_TIMEOUT,
            fetch(`${API_BASE_URL}/weather/${encodedCity}`)
        );
        
        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || 'Failed to fetch weather data');
        }
        
        const data = await response.json();
        
        // Validate data
        if (!data.city || !data.temperature) {
            throw new Error('Invalid weather data received');
        }
        
        displayWeather(data);
        
    } catch (error) {
        console.error('Fetch Error:', error);
        
        // Handle different error types
        let errorMessage = '';
        
        if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please check your internet connection.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Cannot connect to backend server. Please make sure the server is running on port 3000.';
        } else if (error.message.includes('404')) {
            errorMessage = 'City not found. Please check the spelling and try again.';
        } else {
            errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        }
        
        showError(errorMessage);
        welcomeMessage.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Display weather data on UI
function displayWeather(data) {
    // Update city information
    cityNameEl.textContent = data.city;
    countryNameEl.textContent = data.country;
    
    // Update temperature
    temperatureEl.textContent = data.temperature;
    
    // Update condition
    conditionEl.textContent = data.condition;
    
    // Update humidity
    humidityEl.textContent = `${data.humidity}%`;
    
    // Update wind speed
    windSpeedEl.textContent = `${data.windSpeed} km/h`;
    
    // Set weather icon
    if (data.iconUrl) {
        weatherIconEl.src = data.iconUrl;
        weatherIconEl.alt = data.condition;
    }
    
    // Show weather card, hide welcome message
    weatherContent.classList.remove('hidden');
    welcomeMessage.classList.add('hidden');
    
    // Add smooth animation
    weatherContent.style.animation = 'none';
    setTimeout(() => {
        weatherContent.style.animation = 'fadeIn 0.5s ease';
    }, 10);
    
    // Clear input for better UX
    cityInput.value = '';
}

// Show error message with animation
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Hide error message
function hideError() {
    if (errorMessage) {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';
    }
}

// Handle search action
function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name 🌍');
        cityInput.focus();
        return;
    }
    
    if (city.length < 2) {
        showError('Please enter a valid city name (at least 2 characters)');
        return;
    }
    
    fetchWeather(city);
}

// Handle Enter key press
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Search button click
searchBtn.addEventListener('click', handleSearch);

// Example city click functionality
document.querySelectorAll('.example-badge').forEach(badge => {
    badge.addEventListener('click', () => {
        const city = badge.textContent;
        cityInput.value = city;
        fetchWeather(city);
    });
});

// Check backend connection on load
async function checkBackendConnection() {
    try {
        const response = await timeoutPromise(5000, fetch(`${API_BASE_URL}/health`));
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend server is running:', data.message);
        } else {
            throw new Error('Health check failed');
        }
    } catch (error) {
        console.warn('⚠️ Backend server not running');
        showError('⚠️ Backend server not connected. Please start the server with "npm start" in the backend folder.');
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection();
    
    // Focus on input field
    cityInput.focus();
});