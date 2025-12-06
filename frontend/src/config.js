/**
 * Application configuration
 * Centralizes all environment-dependent settings
 */

const config = {
    // Backend API base URL
    // In development: http://127.0.0.1:5000 (backend server)
    // In production: Should be set via VITE_API_URL environment variable
    apiUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000',
};

export default config;
