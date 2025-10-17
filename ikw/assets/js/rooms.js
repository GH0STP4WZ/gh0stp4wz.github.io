import { GAMEMODE_MAP } from './config.js';
import { formatTimeAgo } from './utils.js';
import { getMiiAvatarUrl } from './mii.js';
import { showConnectionMap } from './connection-map.js';

function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderRooms(rooms) {
    const container = document.getElementById('roomsContainer');
    
    if (!rooms || rooms.length === 0) {
        container.innerHTML = '<div class="no-rooms">No one is online right now. How Lonely...</div>';
        return;
    }

    const roomsHTML = rooms.map(room => {
        const players = Object.values(room.players);
        const hostPlayer = players.find(p => room.host === Object.keys(room.players).find(key => room.players[key] === p));
        
        let gamemodeId = '';
        let gamemodeName = 'Friend Room';
        if (room.rk) {
            gamemodeId = room.rk.split('_')[1];
            gamemodeName = GAMEMODE_MAP[gamemodeId] || `Unknown (${sanitizeHTML(gamemodeId)})`;
        }
        
        const playersHTML = players.map(player => {
            const isHost = player === hostPlayer;
            const avatarId = `avatar-${player.fc || Math.random()}`;
            
            setTimeout(async () => {
                const avatarElement = document.getElementById(avatarId);
                if (!avatarElement) return;
                
                avatarElement.classList.add('loading');
                
                try {
                    const avatarUrl = await getMiiAvatarUrl(player);
                    
                    let guestAvatarHtml = '';
                    if (player.mii && player.mii.length > 1) {
                        const guestPlayer = {
                            mii: [{
                                data: player.mii[1].data,
                                name: player.mii[1].name
                            }],
                            fc: `guest-${player.fc}`
                        };
                        const guestAvatarUrl = await getMiiAvatarUrl(guestPlayer);
                        const guestName = sanitizeHTML(player.mii[1].name);
                        guestAvatarHtml = `
                            <div class="guest-avatar" data-tooltip="Guest: ${guestName}">
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
                            ${player.openhost === "true" ? '<div class="openhost-badge" data-tooltip="Openhost enabled">OH</div>' : ''}
                            ${guestAvatarHtml}
                        `;
                        avatarElement.classList.remove('loading');
                    } else {
                        avatarElement.innerHTML = `
                            👤
                            ${player.openhost === "true" ? '<div class="openhost-badge" data-tooltip="Openhost enabled">OH</div>' : ''}
                            ${guestAvatarHtml}
                        `;
                        avatarElement.classList.remove('loading');
                    }
                } catch (error) {
                    console.error('Error loading avatar:', error);
                    const guestName = player.mii && player.mii.length > 1 ? sanitizeHTML(player.mii[1].name) : '';
                    avatarElement.innerHTML = `
                        👤
                        ${player.openhost === "true" ? '<div class="openhost-badge" data-tooltip="Openhost enabled">OH</div>' : ''}
                        ${guestName ? `<div class="guest-avatar" data-guest-name="${guestName}">👤</div>` : ''}
                    `;
                    avatarElement.classList.remove('loading');
                }
            }, 100);

            const scoresHTML = [];
            if (player.ev) {
                scoresHTML.push(`<div class="score-item"><span class="score-label">VR:</span><span class="score-value">${player.ev}</span></div>`);
            }
            if (player.eb) {
                scoresHTML.push(`<div class="score-item"><span class="score-label">BR:</span><span class="score-value">${player.eb}</span></div>`);
            }
            
            const playerName = sanitizeHTML(player.name || 'Unknown');
            const playerFC = sanitizeHTML(player.fc || 'N/A');
            
            return `
                <div class="player-card">
                    <div class="mii-avatar" id="${avatarId}">
                        👤
                    </div>
                    <div class="player-info">
                        <div class="player-name">
                            ${isHost ? '<span class="crown-icon">👑</span>' : ''}
                            ${playerName}
                        </div>
                        <div class="player-details">
                            <div class="player-fc">FC: ${playerFC}</div>
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
                        <span class="info-value">${sanitizeHTML(room.race.course)}</span>
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
                    <div class="room-id">Room ${sanitizeHTML(room.id.toString())}</div>
                    <div class="room-gamemode ${!room.rk ? 'friend-room-badge' : ''}" 
                         onclick="filterByGamemode('${!room.rk ? 'friend' : sanitizeHTML(gamemodeId)}')" 
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
