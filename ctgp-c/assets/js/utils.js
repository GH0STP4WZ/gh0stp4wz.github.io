export function updateStatus(status, text) {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const lastUpdate = document.getElementById('lastUpdate');
    
    statusElement.className = `status ${status}`;
    statusText.textContent = text;
    
    if (status === 'connected') {
        lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
}

export function formatTimeAgo(dateString) {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return created.toLocaleDateString();
} 