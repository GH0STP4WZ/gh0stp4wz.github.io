import { GAMEMODE_MAP } from './config.js';
import { formatTimeAgo } from './utils.js';
import { getMiiAvatarUrl } from './mii.js';
import { showConnectionMap } from './connection-map.js';

export function renderRooms(rooms) {
    const container = document.getElementById('roomsContainer');
    
    if (!rooms || rooms.length === 0) {
        container.innerHTML = '<div class="no-rooms">No one is online right now. How Lonely...</div>';
        return;
    }

    const roomsHTML = rooms.map(room => {
        const players = Object.values(room.players);
        const hostPlayer = players.find(p => room.host === Object.keys(room.players).find(key => room.players[key] === p));
        
        // Handle gamemode display for both VS rooms and friend rooms
        let gamemodeId = '';
        let gamemodeName = 'Friend Room';
        if (room.rk) {
            gamemodeId = room.rk.split('_')[1];
            gamemodeName = GAMEMODE_MAP[gamemodeId] || `Unknown (${gamemodeId})`;
        }
        
        const playersHTML = players.map(player => {
            const isHost = player === hostPlayer;
            const avatarId = `avatar-${player.fc || Math.random()}`;
            
            // Set up avatar loading
            setTimeout(async () => {
                const avatarElement = document.getElementById(avatarId);
                if (!avatarElement) return;
                
                avatarElement.classList.add('loading');
                
                try {
                    const avatarUrl = await getMiiAvatarUrl(player);
                    
                    // Check if there's a guest player and get their Mii
                    let guestAvatarHtml = '';
                    if (player.mii && player.mii.length > 1) {
                        // Create a temporary player object for the guest to use with getMiiAvatarUrl
                        const guestPlayer = {
                            mii: [{
                                data: player.mii[1].data,
                                name: player.mii[1].name
                            }],
                            fc: `guest-${player.fc}` // Use different FC to avoid cache collision
                        };
                        const guestAvatarUrl = await getMiiAvatarUrl(guestPlayer);
                        guestAvatarHtml = `
                            <div class="guest-avatar" data-tooltip="Guest: ${player.mii[1].name}">
                                ${guestAvatarUrl ? 
                                    `<img src="${guestAvatarUrl}" alt="Guest Mii" onerror="this.parentElement.innerHTML='👤';">` : 
                                    '👤'
                                }
                            </div>
                        `;
                    }
                    
                    if (avatarUrl) {
                        avatarElement.innerHTML = `
                            <img src="${avatarUrl}" alt="Mii Avatar" onerror="this.parentElement.innerHTML='👤'; this.parentElement.classList.remove('loading');">
                            ${player.openhost === "true" ? '<div class="openhost-badge" data-tooltip="Opehost enabled">OH</div>' : ''}
                            ${guestAvatarHtml}
                        `;
                        avatarElement.classList.remove('loading');
                    } else {
                        avatarElement.innerHTML = `
                            👤
                            ${player.openhost === "true" ? '<div class="openhost-badge" data-tooltip="Open hosting enabled">OH</div>' : ''}
                            ${guestAvatarHtml}
                        `;
                        avatarElement.classList.remove('loading');
                    }
                } catch (error) {
                    console.error('Error loading avatar:', error);
                    avatarElement.innerHTML = `
                        👤
                        ${player.openhost === "true" ? '<div class="openhost-badge" data-tooltip="Open hosting enabled">OH</div>' : ''}
                        ${player.mii && player.mii.length > 1 ? `<div class="guest-avatar" data-guest-name="${player.mii[1].name}">👤</div>` : ''}
                    `;
                    avatarElement.classList.remove('loading');
                }
            }, 100);

            // Build scores section
            const scoresHTML = [];
            if (player.ev) {
                scoresHTML.push(`<div class="score-item"><span class="score-label">VR:</span><span class="score-value">${player.ev}</span></div>`);
            }
            if (player.eb) {
                scoresHTML.push(`<div class="score-item"><span class="score-label">BR:</span><span class="score-value">${player.eb}</span></div>`);
            }
            
            return `
                <div class="player-card">
                    <div class="mii-avatar" id="${avatarId}">
                        👤
                    </div>
                    <div class="player-info">
                        <div class="player-name">
                            ${isHost ? '<span class="crown-icon">👑</span>' : ''}
                            ${player.name || 'Unknown'}
                        </div>
                        <div class="player-details">
                            <div class="player-fc">FC: ${player.fc || 'N/A'}</div>
                            ${scoresHTML.length > 0 ? `<div class="player-scores">${scoresHTML.join('')}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const roomInfo = `
            <div class="room-info">
                <div class="info-item">
                    <span class="info-label">Players</span>
                    <span class="info-value">${players.length}/12</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Type</span>
                    <span class="info-value">${room.type === 'anybody' ? 'Public' : 'Private'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Created</span>
                    <span class="info-value">${formatTimeAgo(room.created)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Status</span>
                    <span class="info-value">${room.suspend ? 'Suspended' : 'Active'}</span>
                </div>
                ${room.race ? `
                    <div class="info-item">
                        <span class="info-label">Race</span>
                        <span class="info-value">#${room.race.num}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Course</span>
                        <span class="info-value">${room.race.course}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">CC</span>
                        <span class="info-value">${room.race.cc === 1 ? '50cc' : room.race.cc === 2 ? '100cc' : room.race.cc === 3 ? '150cc' : 'Mirror'}</span>
                    </div>
                ` : ''}
            </div>
        `;

        return `
            <div class="room-card ${!room.rk ? 'friend-room' : ''}">
                <div class="room-header">
                    <div class="room-id">Room ${room.id}</div>
                    <div class="room-gamemode ${!room.rk ? 'friend-room-badge' : ''}" 
                         onclick="filterByGamemode('${!room.rk ? 'friend' : gamemodeId}')" 
                         style="cursor: pointer;" 
                         title="Click to filter by ${!room.rk ? 'friend rooms' : 'this gamemode'}">
                        ${!room.rk ? '👥 ' : ''}${gamemodeName}
                    </div>
                </div>
                ${roomInfo}
                <div class="players-section">
                    <div class="players-header">👥 Players (${players.length})</div>
                    <div class="players-grid">
                        ${playersHTML}
                    </div>
                </div>
                ${players.length > 1 ? `
                    <div class="connection-map-btn" onclick="window.showConnectionMap(${JSON.stringify(room).replace(/"/g, '&quot;')})">
                        ⚡
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = roomsHTML;
} 