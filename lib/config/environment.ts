/**
 * Environment configuration for the app
 * Centralized configuration for all API services
 */

// Environment types for type safety
type Environment = 'DEVELOPMENT';

// Base URLs for development environment
const DEVELOPMENT_URLS = {
  // For emulator/simulator, Android uses 10.0.2.2, iOS uses localhost
  // For real devices, use your machine's IP or ngrok URLs
  MAIN_API: process.env.EXPO_PUBLIC_MAIN_API, 
  AI_SERVICE: process.env.EXPO_PUBLIC_AI_SERVICE, 
  YOLO_SERVICE: process.env.EXPO_PUBLIC_YOLO_SERVICE,
  PINATA_GATEWAY: process.env.EXPO_PUBLIC_PINATA_GATEWAY,
};

// Current environment is always development
const CURRENT_ENV: Environment = 'DEVELOPMENT';

// API Configuration object with all endpoints
export const API_CONFIG = {
  // Current environment name for reference
  ENVIRONMENT: CURRENT_ENV,
  
  // Base URLs
  MAIN_API_URL: DEVELOPMENT_URLS.MAIN_API,
  AI_SERVICE_URL: DEVELOPMENT_URLS.AI_SERVICE,
  YOLO_SERVICE_URL: DEVELOPMENT_URLS.YOLO_SERVICE,
  PINATA_GATEWAY: DEVELOPMENT_URLS.PINATA_GATEWAY,
  
  
  // API endpoints (paths) for each service
  ENDPOINTS: {
    // Main API endpoints
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH_TOKEN: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    USER: {
      PROFILE: '/users/me',
      UPDATE_PROFILE: '/users/me',
      BY_ID: (id: string) => `/users/${id}`,
      ALL: '/users',
    },
    CHALLENGE: {
      LIST: '/challenges',
      SUBMIT: '/challenges/submit',
      DETAIL: (id: string) => `/challenges/${id}`,
    },
    FRIENDS: {
      LIST: '/friends',
      REQUESTS: '/friends/requests',
      ADD: '/friends/add',
      ACCEPT: '/friends/accept',
      ALL: '/friends',
      BY_ID: (id: string) => `/friends/${id}`,
    },
    MESSAGES: {
      ALL: '/messages',
      BY_USER: (userId: string) => `/messages/${userId}`,
      MARK_READ: (id: string) => `/messages/${id}/read`,
    },
    FILES: {
      UPLOAD: '/files/upload',
      BY_PATH: (path: string) => `/files/${path}`,
      BY_ID: (id: string) => `/files/${id}`,
      IPFS_TEST: '/files/ipfs-test',
    },
    PHOTOS: {
      UPLOAD: '/photos/upload',
      ME: '/photos/me',
      FRIEND: (friendId: string) => `/photos/friends/${friendId}`,
      BY_ID: (id: string) => `/photos/${id}`,
    },
    
    // AI service endpoints (combines chat and food suggestion)
    AI: {
      CHAT: '/api/chat',
      FOOD_SUGGESTIONS: (userId: number) => `/suggestions/food/${userId}`,
      INDEX: (userId: number) => `/index/${userId}`,
      INDEX_ALL: '/index/all',
      SUGGESTIONS: '/api/suggestions/food',
      ANSWER: '/api/suggestion/answer',
    },
    
    // YOLO service endpoints
    YOLO: {
      DETECT: '/detect',
    },
  },
  
  // Default timeout in milliseconds
  TIMEOUT: 15000,
  
  // Helper to get full URL for a service and endpoint
  getUrl: (service: 'MAIN_API' | 'AI_SERVICE' | 'YOLO_SERVICE', endpoint: string): string => {
    const baseUrl = API_CONFIG[`${service}_URL`];
    // Remove leading slash from endpoint if it exists
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
  }
};

// For backward compatibility, export API_URL
export const API_URL = API_CONFIG.MAIN_API_URL;

// App version
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  ENABLE_SOCIAL_LOGIN: false,
  ENABLE_PUSH_NOTIFICATIONS: false,
  ENABLE_IMAGE_UPLOAD: true,
  ENABLE_FOOD_SUGGESTIONS: true,
};

// Development helper - always true since we're only using development environment
export const isDevelopment = true; 