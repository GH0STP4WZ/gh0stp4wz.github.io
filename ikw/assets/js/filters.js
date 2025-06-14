import { GAMEMODE_MAP } from './config.js';
import { renderRooms } from './rooms.js';

// Populate gamemode filter dropdown from GAMEMODE_MAP
export function populateGamemodeFilter() {
    const filterSelect = document.getElementById('gamemode-filter');
    const currentValue = filterSelect.value;
    const showFriendRooms = document.getElementById('friendRoomsToggle').checked;
    
    // Clear existing options except "All Gamemodes"
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }
    
    // Add Friend Room option only if toggle is enabled
    if (showFriendRooms) {
        const friendOption = document.createElement('option');
        friendOption.value = 'friend';
        friendOption.textContent = '👥 Friend Rooms';
        filterSelect.appendChild(friendOption);
    }
    
    // Add options for each gamemode in GAMEMODE_MAP
    Object.entries(GAMEMODE_MAP).forEach(([gamemodeId, gamemodeName]) => {
        const option = document.createElement('option');
        option.value = gamemodeId;
        option.textContent = gamemodeName;
        filterSelect.appendChild(option);
    });
    
    // Restore selected value if it exists and is still valid
    if (currentValue && [...filterSelect.options].some(opt => opt.value === currentValue)) {
        filterSelect.value = currentValue;
    } else {
        // If current value is 'friend' but toggle is off, reset to 'all'
        filterSelect.value = 'all';
    }
}

// Toggle friend rooms visibility
export function toggleFriendRooms() {
    const toggle = document.getElementById('friendRoomsToggle');
    const disclaimer = document.getElementById('friendRoomsDisclaimer');
    const filterSelect = document.getElementById('gamemode-filter');
    
    // Show/hide disclaimer
    disclaimer.style.display = toggle.checked ? 'flex' : 'none';
    
    // If currently filtering by friend rooms but toggle is off, reset to all
    if (!toggle.checked && filterSelect.value === 'friend') {
        filterSelect.value = 'all';
    }
    
    // Repopulate filter options
    populateGamemodeFilter();
    
    // Fetch rooms again to update the available rooms list
    window.manualRefresh();
}

// Make toggleFriendRooms globally accessible
window.toggleFriendRooms = toggleFriendRooms;

// Filter rooms by gamemode
export function filterRooms() {
    const filterValue = document.getElementById('gamemode-filter').value;
    const showFriendRooms = document.getElementById('friendRoomsToggle').checked;
    
    if (!window.allRooms || window.allRooms.length === 0) {
        return;
    }
    
    let filteredRooms = window.allRooms;
    
    if (filterValue !== 'all') {
        filteredRooms = window.allRooms.filter(room => {
            if (filterValue === 'friend') {
                // Show only friend rooms (rooms without RK)
                return !room.rk && room.game === 'mariokartwii';
            } else {
                // Show only VS rooms with matching gamemode
                const gamemodeId = room.rk ? room.rk.split('_')[1] : '';
                return gamemodeId === filterValue;
            }
        });
        
        // If no rooms found for selected filter, show suggestion
        if (filteredRooms.length === 0) {
            const container = document.getElementById('roomsContainer');
            const filterName = filterValue === 'friend' ? 'Friend Rooms' : GAMEMODE_MAP[filterValue] || 'Unknown';
            container.innerHTML = `
                <div class="filter-suggestion">
                    <div class="suggestion-text">No rooms found for "${filterName}"</div>
                    ${filterValue === 'friend' && !showFriendRooms ? `
                        <div class="suggestion-text">
                            <span class="suggestion-link" onclick="document.getElementById('friendRoomsToggle').checked = true; toggleFriendRooms();">
                                Enable friend rooms to see them here
                            </span>
                        </div>
                    ` : `
                        <div class="suggestion-text">
                            <span class="suggestion-link" onclick="document.getElementById('gamemode-filter').value='all'; filterRooms();">
                                Try changing your filter to see all available rooms
                            </span>
                        </div>
                    `}
                </div>
            `;
            return;
        }
    }
    
    renderRooms(filteredRooms);
}

// Filter by specific gamemode when clicking on gamemode badge
export function filterByGamemode(gamemodeId) {
    const filterSelect = document.getElementById('gamemode-filter');
    filterSelect.value = gamemodeId;
    filterRooms();
    
    // Scroll to top to show the filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
} 