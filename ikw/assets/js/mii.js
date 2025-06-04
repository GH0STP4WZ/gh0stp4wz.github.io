// Default avatar for failed fetches
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNzAiIGhlaWdodD0iMjcwIiB2aWV3Qm94PSIwIDAgMjcwIDI3MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNiIgZmlsbD0iIzY2NiI+TWlpPC90ZXh0Pjwvc3ZnPg==';

// Cache duration in milliseconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FAILED_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Convert base64 to blob
export function base64toBlob(data) {
    const bytes = atob(data);
    let length = bytes.length;
    let out = new Uint8Array(length);

    while (length--) {
        out[length] = bytes.charCodeAt(length);
    }

    return new Blob([out]);
}

// Sleep function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a cache entry is expired
function isCacheExpired(timestamp, duration) {
    return Date.now() - timestamp > duration;
}

// Fetch image through CORS proxy and convert to data URL
export async function fetchImageAsDataUrl(url) {
    const CORS_PROXIES = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy?quest='
    ];
    
    let currentCorsProxyIndex = 0;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            const proxyIndex = (currentCorsProxyIndex + i) % CORS_PROXIES.length;
            const proxy = CORS_PROXIES[proxyIndex];
            
            try {
                // Add a small delay between attempts to avoid rate limits
                if (retryCount > 0 || i > 0) {
                    await sleep(1000); // Wait 1 second between attempts
                }
                
                const response = await fetch(proxy + encodeURIComponent(url));
                
                if (response.ok) {
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                }
                
                // If we get a 429 (rate limit), try the next proxy
                if (response.status === 429) {
                    console.warn(`CORS proxy ${proxy} rate limited, trying next...`);
                    continue;
                }
            } catch (error) {
                console.warn(`CORS proxy ${proxy} failed:`, error);
                continue;
            }
        }
        retryCount++;
        // If we've tried all proxies, wait a bit longer before the next round
        if (retryCount < maxRetries) {
            await sleep(2000); // Wait 2 seconds before trying all proxies again
        }
    }
    
    // If all retries failed, return the default avatar
    console.warn('All CORS proxies failed, using default avatar');
    return DEFAULT_AVATAR;
}

// Generate Mii avatar using RC24 and Nintendo services
export async function getMiiAvatarUrl(player) {
    if (!player.fc || player.fc === 'N/A' || !player.mii || !player.mii[0] || !player.mii[0].data) {
        return DEFAULT_AVATAR;
    }

    const fc = player.fc.replace(/[-\s]/g, '');
    
    // Check success cache first
    if (window.miiCache && window.miiCache.has(fc)) {
        const cacheEntry = window.miiCache.get(fc);
        if (!isCacheExpired(cacheEntry.timestamp, CACHE_DURATION)) {
            return cacheEntry.url;
        }
        // If expired, remove it
        window.miiCache.delete(fc);
    }

    // Check failed cache
    if (window.miiFailedCache && window.miiFailedCache.has(fc)) {
        const failedEntry = window.miiFailedCache.get(fc);
        if (!isCacheExpired(failedEntry.timestamp, FAILED_CACHE_DURATION)) {
            return DEFAULT_AVATAR;
        }
        // If expired, remove it and try again
        window.miiFailedCache.delete(fc);
    }

    try {
        // Use the same process as your server
        const miiData = player.mii[0].data;
        
        // Create FormData for the Mii conversion service
        const formData = new FormData();
        formData.append("data", base64toBlob(miiData), "mii.dat");
        formData.append("platform", "wii");

        // Send to RC24's Mii studio service
        const response = await fetch("https://miicontestp.wii.rc24.xyz/cgi-bin/studio.cgi", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Bad response from RC24 Mii service, status code: " + response.status);
        }

        const json = await response.json();

        if (!json || !json.mii) {
            throw new Error("Malformed JSON response from RC24 Mii service");
        }

        // Generate the Nintendo Mii Studio URL
        const miiImageUrl = `https://studio.mii.nintendo.com/miis/image.png?data=${json.mii}&type=face&expression=normal&width=270&bgColor=FFFFFF00&clothesColor=default&cameraXRotate=0&cameraYRotate=0&cameraZRotate=0&characterXRotate=0&characterYRotate=0&characterZRotate=0&lightDirectionMode=none&instanceCount=1`;

        // Fetch the image through CORS proxy and convert to data URL
        const dataUrl = await fetchImageAsDataUrl(miiImageUrl);

        // Cache successful result with timestamp
        if (window.miiCache && dataUrl !== DEFAULT_AVATAR) {
            window.miiCache.set(fc, {
                url: dataUrl,
                timestamp: Date.now()
            });
        }
        return dataUrl;

    } catch (error) {
        console.error("Error generating Mii avatar:", error);
        
        // Cache the failure with timestamp
        if (window.miiFailedCache) {
            window.miiFailedCache.set(fc, {
                timestamp: Date.now()
            });
        }
        return DEFAULT_AVATAR;
    }
} 