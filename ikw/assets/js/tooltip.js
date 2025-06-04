// Initialize tooltip functionality
export function initTooltip() {
    const tooltip = document.getElementById('tooltip');
    let tooltipTimeout;
    
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;
        
        clearTimeout(tooltipTimeout);
        const text = target.getAttribute('data-tooltip');
        tooltip.textContent = text;
        tooltip.style.display = 'block';
        
        // Force a reflow to enable the transition
        tooltip.offsetHeight;
        tooltip.classList.add('visible');
        
        // Position the tooltip above the element
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltipRect.width / 2) + 'px';
        tooltip.style.top = rect.top - tooltipRect.height - 10 + 'px';
    });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;
        
        tooltip.classList.remove('visible');
        tooltipTimeout = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 200); // Match the transition duration
    });
} 