// Import configuration and modules
import { API_ENDPOINT, REFRESH_INTERVAL, CORS_PROXIES, GAMEMODE_MAP } from './config.js';
import { updateStatus, formatTimeAgo } from './utils.js';
import { base64toBlob, fetchImageAsDataUrl, getMiiAvatarUrl } from './mii.js';
import { generateConnectionMap, showConnectionMap, closeConnectionModal } from './connection-map.js';
import { populateGamemodeFilter, filterRooms, filterByGamemode } from './filters.js';
import { renderRooms } from './rooms.js';
import { initTooltip } from './tooltip.js';

// Initialize global state
function initializeGlobalState() {
    window.miiCache = new Map(); // Cache for successful Mii images
    window.miiFailedCache = new Map(); // Cache for failed Mii fetches
    window.allRooms = []; // Store all rooms for filtering
}

// Global variables
let updateInterval;
let isRefreshing = false;
let currentCorsProxyIndex = 0;

async function fetchRooms() {
    const container = document.getElementById('roomsContainer');
    container.classList.add('updating');

    try {
        updateStatus('connecting', 'Fetching rooms...');
        
        let error;
        // Try each CORS proxy until one works
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            try {
                const proxy = CORS_PROXIES[(currentCorsProxyIndex + i) % CORS_PROXIES.length];
                const response = await fetch(proxy + encodeURIComponent(API_ENDPOINT));
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Update the current proxy index to the one that worked
                currentCorsProxyIndex = (currentCorsProxyIndex + i) % CORS_PROXIES.length;
                
                // Filter for VS rooms only
                const vsRooms = data.filter(room => {
                    const showFriendRooms = document.getElementById('friendRoomsToggle')?.checked || false;
                    
                    // If it's a friend room, only include if toggle is enabled
                    if (!room.rk && room.game === 'mariokartwii') {
                        return showFriendRooms;
                    }
                    
                    // For VS rooms, include if they have a valid room key
                    return room.rk && room.rk.startsWith('vs_') && 
                           room.game === 'mariokartwii' &&
                           GAMEMODE_MAP[room.rk.split('_')[1]];
                });
                
                // Store all rooms for filtering in global scope
                window.allRooms = vsRooms;
                
                // If API returns data but no VS rooms found, assume no one is online
                if (vsRooms.length === 0) {
                    updateStatus('connected', 'No rooms available');
                    document.getElementById('roomsContainer').innerHTML = 
                        '<div class="no-rooms">No one is online right now. How Lonely...</div>';
                } else {
                    // Apply current filter
                    filterRooms();
                    updateStatus('connected', `API OK! Found ${vsRooms.length} VS rooms`);
                }
                
                // Success! Remove updating class and exit
                container.classList.remove('updating');
                return;
                
            } catch (e) {
                error = e;
                console.warn(`CORS proxy ${CORS_PROXIES[(currentCorsProxyIndex + i) % CORS_PROXIES.length]} failed:`, e);
                // Continue to next proxy
            }
        }
        
        // If we get here, all proxies failed
        throw error || new Error('All CORS proxies failed');
        
    } catch (error) {
        console.error('API ERROR:', error, 'If you think this is incorrect, Please reach out to Riddim-glitch!');
        updateStatus('error', `Error: ${error.message}`);
        document.getElementById('roomsContainer').innerHTML = 
            `<div class="no-rooms">Failed to load rooms: ${error.message}</div>`;
    } finally {
        // Always ensure the updating class is removed
        container.classList.remove('updating');
    }
}

async function manualRefresh() {
    if (isRefreshing) return;
    
    const refreshBtn = document.getElementById('refreshBtn');
    isRefreshing = true;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '⟳ Refreshing...';
    
    try {
        await fetchRooms();
    } finally {
        isRefreshing = false;
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = 'Refetch Room Data';
    }
}

function startAutoUpdate() {
    updateInterval = setInterval(fetchRooms, REFRESH_INTERVAL);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize global state
    initializeGlobalState();
    
    // Make functions globally accessible
    window.filterByGamemode = filterByGamemode;
    window.showConnectionMap = showConnectionMap;
    window.closeConnectionModal = closeConnectionModal;
    window.manualRefresh = manualRefresh;
    window.filterRooms = filterRooms;
    
    populateGamemodeFilter();
    fetchRooms();
    startAutoUpdate();
    initTooltip();

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeConnectionModal();
        }
    });
}); 