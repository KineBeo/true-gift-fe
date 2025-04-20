/**
 * Environment configuration for the app
 * In a real app, you would use environment variables or a .env file
 */

// API URL Configuration
export const API_CONFIG = {
  // For local development with a real device, use your machine's IP
  // For emulator/simulator, Android: 10.0.2.2, iOS: localhost
  DEV_API_URL: 'https://example.ngrok-free.app/api/v1', // Replace with your IP
  PROD_API_URL: 'https://api.truegift.com/api/v1',
  // Default timeout in milliseconds
  TIMEOUT: 15000,
};

// Get the appropriate API URL based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';

export const API_URL = isDevelopment ? API_CONFIG.DEV_API_URL : API_CONFIG.PROD_API_URL;

// App version
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  ENABLE_SOCIAL_LOGIN: false,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_IMAGE_UPLOAD: true,
}; 