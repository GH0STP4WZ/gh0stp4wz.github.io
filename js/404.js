// Keep track of the last shown meme index
let lastMemeIndex = -1;

function getRandomIndex(max) {
  // Create an array of cryptographically random values
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  
  // Use the random value to get an index
  return Math.floor((array[0] / (0xffffffff + 1)) * max);
}

function getUniqueRandomIndex(max) {
  if (max <= 1) return 0;
  
  let newIndex;
  do {
    newIndex = getRandomIndex(max);
  } while (newIndex === lastMemeIndex);
  
  lastMemeIndex = newIndex;
  return newIndex;
}

async function loadRandomMeme() {
  try {
    // Add cache-busting query parameter with current timestamp
    const response = await fetch('/memes.json?t=' + Date.now());
    const data = await response.json();
    const memes = data.memes;
    
    // Get a random index that's different from the last one
    const randomIndex = getUniqueRandomIndex(memes.length);
    const randomMeme = memes[randomIndex];

    document.getElementById('meme-title').textContent = randomMeme.title;
    document.getElementById('meme-subtitle').textContent = randomMeme.subtitle;

    const memeContainer = document.getElementById('meme-content');
    memeContainer.innerHTML = '';

    if (randomMeme.type === 'youtube') {
      const iframe = document.createElement('iframe');
      // Add autoplay=1, mute=1, and loop=1 to the YouTube URL
      const videoUrl = new URL(randomMeme.content);
      videoUrl.searchParams.set('autoplay', '1');
      videoUrl.searchParams.set('mute', '1');
      videoUrl.searchParams.set('loop', '1');
      // For YouTube, we need to also set playlist to the same video ID to enable looping
      const videoId = videoUrl.pathname.split('/').pop();
      videoUrl.searchParams.set('playlist', videoId);
      iframe.src = videoUrl.toString();
      iframe.width = '560';
      iframe.height = '315';
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.classList.add('meme-youtube');
      memeContainer.appendChild(iframe);
    } else {
      const img = document.createElement('img');
      // Add cache-busting to image URLs that aren't from external services
      img.src = randomMeme.content + (randomMeme.content.includes('?') ? '&' : '?') + 't=' + Date.now();
      img.alt = randomMeme.subtitle;
      img.classList.add('meme-image');
      memeContainer.appendChild(img);
    }
  } catch (error) {
    console.error('Error loading meme:', error);
  }
}

// Run on initial page load
loadRandomMeme();

// Also run when the page is shown (handles back/forward navigation)
window.addEventListener('pageshow', (event) => {
  // Check if the page is being shown from the bfcache
  if (event.persisted) {
    loadRandomMeme();
  }
}); 