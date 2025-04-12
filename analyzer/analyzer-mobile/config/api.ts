// API configuration
// Replace this with your computer's IP address when running on a physical device
// For emulators, you can use 10.0.2.2 (Android) or localhost (iOS)
export const API_URL = 'http://192.168.8.143:5000/api';

// Helper function to get the full URL for an API endpoint
export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`; 