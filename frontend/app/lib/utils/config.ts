// Environment configuration and API endpoints

// Default API URL with fallback to localhost for development
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// API endpoints
export const API_ENDPOINTS = {
  chat: `${API_BASE_URL}/chat`,
  conversations: `${API_BASE_URL}/conversations`,
  user: `${API_BASE_URL}/user`,
};

// Default configuration for the application
export const APP_CONFIG = {
  appName: 'TreeGPT',
  defaultModel: 'gpt-3.5-turbo',
  maxHistoryLength: 100,
};

// Feature flags for enabling/disabling functionality
export const FEATURES = {
  shareEnabled: process.env.NEXT_PUBLIC_SHARE_ENABLED === 'true',
  exportEnabled: process.env.NEXT_PUBLIC_EXPORT_ENABLED === 'true',
  compareEnabled: true,
}; 