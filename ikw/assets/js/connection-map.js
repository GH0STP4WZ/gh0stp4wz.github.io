// Generate connection map HTML
export function generateConnectionMap(room) {
    const players = Object.values(room.players);
    const playerKeys = Object.keys(room.players);
    
    if (players.length <= 1) {
        return '<p style="color: var(--text-muted); text-align: center;">Connection map not available for rooms with only one player.</p>';
    }
    
    let tableHTML = `
        <div class="connection-map-container">
            <table class="connection-map">
                <thead>
                    <tr>
                        <th></th>
    `;
    
    // Add column headers (player IDs)
    for (let i = 0; i < players.length; i++) {
        tableHTML += `<th>${i + 1}</th>`;
    }
    
    tableHTML += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add rows for each player
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerKey = playerKeys[i];
        const playerName = player.name || 'Unknown';
        
        tableHTML += `
            <tr>
                <td class="player-row"><span class="player-id">${i + 1}</span>${playerName}</td>
        `;
        
        // Add connection status for each player
        for (let j = 0; j < players.length; j++) {
            if (i === j) {
                // Self connection
                tableHTML += `<td><span class="connection-dot self"></span></td>`;
            } else {
                // Get connection status from conn_map
                let connectionStatus = 0; // Default to dropped
                
                if (player.conn_map) {
                    // Parse connection map
                    // The conn_map string contains connection status to other players
                    // Each digit represents connection to a player, skipping self
                    let connIndex = j;
                    if (j > i) connIndex--; // Skip self in the map
                    
                    if (connIndex >= 0 && connIndex < player.conn_map.length) {
                        connectionStatus = parseInt(player.conn_map[connIndex], 10);
                    }
                }
                
                let dotClass = 'dropped';
                if (connectionStatus === 2) dotClass = 'good';
                else if (connectionStatus === 1) dotClass = 'unstable';
                
                tableHTML += `<td><span class="connection-dot ${dotClass}"></span></td>`;
            }
        }
        
        tableHTML += `</tr>`;
    }
    
    tableHTML += `
                </tbody>
            </table>
        </div>
        <div class="connection-legend">
            <div class="legend-item">
                <span class="connection-dot good"></span>
                <span>Good</span>
            </div>
            <div class="legend-item">
                <span class="connection-dot unstable"></span>
                <span>Unstable</span>
            </div>
            <div class="legend-item">
                <span class="connection-dot dropped"></span>
                <span>Dropped</span>
            </div>
            <div class="legend-item">
                <span class="connection-dot self"></span>
                <span>Self</span>
            </div>
        </div>
    `;
    
    return tableHTML;
}

// Show connection map modal
export function showConnectionMap(room) {
    const modal = document.getElementById('connectionModal');
    const content = document.getElementById('connectionMapContent');
    
    content.innerHTML = generateConnectionMap(room);
    modal.classList.add('active');
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeConnectionModal();
        }
    };
}

// Close connection map modal
export function closeConnectionModal() {
    const modal = document.getElementById('connectionModal');
    modal.classList.remove('active');
} 