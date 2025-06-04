import { GAMEMODE_MAP } from './config.js';
import { renderRooms } from './rooms.js';

// Populate gamemode filter dropdown from GAMEMODE_MAP
export function populateGamemodeFilter() {
    const filterSelect = document.getElementById('gamemode-filter');
    const currentValue = filterSelect.value;
    
    // Clear existing options except "All Gamemodes"
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }
    
    // Add options for each gamemode in GAMEMODE_MAP
    Object.entries(GAMEMODE_MAP).forEach(([gamemodeId, gamemodeName]) => {
        const option = document.createElement('option');
        option.value = gamemodeId;
        option.textContent = gamemodeName;
        filterSelect.appendChild(option);
    });
    
    // Restore selected value if it exists
    if (currentValue && [...filterSelect.options].some(opt => opt.value === currentValue)) {
        filterSelect.value = currentValue;
    }
}

// Filter rooms by gamemode
export function filterRooms() {
    const filterValue = document.getElementById('gamemode-filter').value;
    
    if (!window.allRooms || window.allRooms.length === 0) {
        return;
    }
    
    let filteredRooms = window.allRooms;
    
    if (filterValue !== 'all') {
        filteredRooms = window.allRooms.filter(room => {
            const gamemodeId = room.rk ? room.rk.split('_')[1] : '';
            return gamemodeId === filterValue;
        });
        
        // If no rooms found for selected gamemode, show suggestion
        if (filteredRooms.length === 0) {
            const container = document.getElementById('roomsContainer');
            const gamemodeName = GAMEMODE_MAP[filterValue] || 'Unknown';
            container.innerHTML = `
                <div class="filter-suggestion">
                    <div class="suggestion-text">No rooms found for "${gamemodeName}"</div>
                    <div class="suggestion-text">
                        <span class="suggestion-link" onclick="document.getElementById('gamemode-filter').value='all'; filterRooms();">
                            Try changing your filter to see all available rooms
                        </span>
                    </div>
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