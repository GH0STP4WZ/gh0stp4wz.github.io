// API endpoint configuration
export const API_ENDPOINT = 'http://rwfc.net/api/groups'; // RetroWFC main endpoint

// Auto-refresh interval in milliseconds (20000 = 20 seconds)
export const REFRESH_INTERVAL = 20000;

// CORS proxy options
export const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/'
];

// Gamemode mapping
export const GAMEMODE_MAP = {
    // "10": "Retros VS", // This is a debug region. I only use it for testing.
    // "11": "Retros OTT", // Further testing Regions
    "669": "Regular VS"
}; 