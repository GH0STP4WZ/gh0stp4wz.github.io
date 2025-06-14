// API endpoint configuration
export const API_ENDPOINT = 'http://rwfc.net/api/groups'; // RetroWFC main endpoint
// export const API_ENDPOINT = 'http://mk.acidpaws.cam/api/groups'; // IKWFC Stage 1 server

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
    "69": "Regular VS",
    "70": "Ultras VS", 
    "71": "Crazy Items",
    "72": "Bob-omb Blast",
    "73": "Infinite Acceleration",
    "74": "Banana Slip",
    "75": "Random Items",
    "76": "Unfair Items",
    "77": "Blue Shell Madness",
    "78": "Mushroom Dash",
    "79": "Bumper Karts",
    "80": "Item Rampage",
    "81": "Item Rain",
    "82": "Shell Break",
    "83": "Riibalanced Stats"
}; 