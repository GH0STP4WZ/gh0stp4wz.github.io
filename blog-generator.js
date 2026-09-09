// blog-generator.js
const fs = require('fs');
const path = require('path');

// Keep marked working on older Node runtimes used by some build environments.
if (typeof Array.prototype.at !== 'function') {
  Array.prototype.at = function(index) {
    const length = this.length >>> 0;
    let resolvedIndex = Number(index) || 0;

    if (resolvedIndex < 0) {
      resolvedIndex += length;
    }

    return resolvedIndex < 0 || resolvedIndex >= length ? undefined : this[resolvedIndex];
  };
}

const marked = require('marked');

function renderMedia(href, title, text) {
  const hrefValue = typeof href === 'string'
    ? href
    : href && typeof href === 'object'
      ? href.href || href.src || ''
      : '';

  const parts = hrefValue.split(',').map(part => part.trim()).filter(Boolean);
  const sources = parts.map(part => {
    const ext = part.split('.').pop().toLowerCase();
    if (/(jpe?g|png|gif|webp|svg)$/.test(ext)) {
      return { type: 'image', src: part, mime: `image/${ext === 'jpg' ? 'jpeg' : ext}` };
    }
    if (/(mp4|webm|ogg)$/.test(ext)) {
      return { type: 'video', src: part, mime: `video/${ext === 'ogv' ? 'ogg' : ext}` };
    }
    if (/(mp3|wav|flac|aac|ogg)$/.test(ext)) {
      return { type: 'audio', src: part, mime: `audio/${ext}` };
    }
    return { type: 'unknown', src: part, mime: '' };
  });

  const imageSource = sources.find(source => source.type === 'image');
  if (imageSource) {
    return `<img src="${imageSource.src}" alt="${text || ''}" ${title ? `title="${title}"` : ''} class="blog-media" />`;
  }

  const videoSources = sources.filter(source => source.type === 'video');
  if (videoSources.length) {
    return `<video controls class="blog-media">${videoSources.map(source => `<source src="${source.src}" type="${source.mime}">`).join('')}Your browser does not support the video tag.</video>`;
  }

  const audioSources = sources.filter(source => source.type === 'audio');
  if (audioSources.length) {
    return `<audio controls class="blog-media">${audioSources.map(source => `<source src="${source.src}" type="${source.mime}">`).join('')}Your browser does not support the audio element.</audio>`;
  }

  return `<img src="${parts[0]}" alt="${text || ''}" ${title ? `title="${title}"` : ''} class="blog-media" />`;
}

function formatDiscordTimestamp(unix, format) {
  let timestamp = Number(unix);
  if (Number.isNaN(timestamp)) return `<t:${unix}>`;
  if (String(timestamp).length > 12) {
    timestamp = Math.floor(timestamp / 1000);
  }

  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return `<t:${unix}>`;

  const options = {
    t: { hour: '2-digit', minute: '2-digit' },
    T: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
    d: { year: 'numeric', month: 'numeric', day: 'numeric' },
    D: { year: 'numeric', month: 'long', day: 'numeric' },
    f: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    F: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  if (format === 'R') {
    const diff = date.getTime() - Date.now();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    if (abs < 60_000) return rtf.format(Math.round(diff / 1000), 'second');
    if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
    if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
    if (abs < 604_800_000) return rtf.format(Math.round(diff / 86_400_000), 'day');
    if (abs < 2_592_000_000) return rtf.format(Math.round(diff / 604_800_000), 'week');
    if (abs < 31_536_000_000) return rtf.format(Math.round(diff / 2_592_000_000), 'month');
    return rtf.format(Math.round(diff / 31_536_000_000), 'year');
  }

  const dateOptions = options[format] || options.f;
  return date.toLocaleString(undefined, dateOptions);
}

const mutedHeadingExtension = {
  name: 'muted-heading',
  level: 'block',
  start(src) { return src.match(/^-#\s+/); },
  tokenizer(src) {
    const rule = /^-#\s+([^\n]+)(?:\n+|$)/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'mutedHeading',
        raw: match[0],
        text: match[1].trim(),
        tokens: this.lexer.inlineTokens(match[1].trim())
      };
    }
  },
  renderer(token) {
    return `<h4 class="muted-header">${this.parser.parseInline(token.tokens)}</h4>\n`;
  }
};

const discordTimestampExtension = {
  name: 'discord-timestamp',
  level: 'inline',
  start(src) { return src.match(/<t:\d+/); },
  tokenizer(src) {
    const rule = /^<t:(\d+)(?::([tTdDfFR]))?>/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'text',
        raw: match[0],
        text: formatDiscordTimestamp(match[1], match[2] || 'f')
      };
    }
  }
};

marked.use({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
  renderer: {
    image(href, title, text) {
      return renderMedia(href, title, text);
    }
  },
  extensions: [mutedHeadingExtension, discordTimestampExtension]
});

// Configuration
const config = {
  postsDirectory: 'posts', // Where Markdown files will be stored
  outputDirectory: 'blog', // Where generated HTML files will go
  blogPostsOutputDirectory: 'blog/blog-posts', // Where individual posts will go
  templatePath: 'templates/blog-post-template.html', // Template for individual posts
  indexTemplatePath: 'templates/index-template.html', // Template for index page
  siteTitle: "Auroras website", // Your site title
  author: "Aurora", // Your name
  profilePicture: "https://api.lanyard.rest/801089753038061669.png", // Your profile picture URL
  themeColor: "#8a2be2" // Your theme color
};

// Create directories if they don't exist
[config.postsDirectory, config.outputDirectory, config.blogPostsOutputDirectory].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Read the templates
const postTemplate = fs.readFileSync(config.templatePath, 'utf8');
const indexTemplate = fs.readFileSync(config.indexTemplatePath, 'utf8');

// Get all markdown files from the posts directory
function getAllPosts() {
  const files = fs.readdirSync(config.postsDirectory);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  
  return markdownFiles.map(file => {
    const filePath = path.join(config.postsDirectory, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Get lines
    const lines = content.split('\n');
    
    // Get title from line 2 (after "title:")
    const title = lines[1].split('title:')[1].trim();
    
    // Get date from line 3 (after "date:")
    const date = lines[2].split('date:')[1].trim();
    
    // Get theme color from line 4 (after "themeColor:")
    const themeColor = lines[3].split('themeColor:')[1].trim() || config.themeColor;
    
    // Get lastUpdated from line 5 (after "lastUpdated:") - optional
    let lastUpdated = null;
    if (lines.length > 4 && lines[4].includes('lastUpdated:')) {
      lastUpdated = lines[4].split('lastUpdated:')[1].trim();
    }
    
    // Remove frontmatter for content
    const markdownContent = content.split('---')[2].trim();
    
    return {
      title,
      date,
      lastUpdated,
      content: marked.parse(markdownContent),
      themeColor,
      isUpdated: lastUpdated && lastUpdated !== date
    };
  }).sort((a, b) => {
    // Sort by lastUpdated (or date if lastUpdated doesn't exist) - oldest first
    const dateA = new Date(a.lastUpdated || a.date);
    const dateB = new Date(b.lastUpdated || b.date);
    return dateA - dateB;
  });
}

// Generate an individual blog post
function generatePost(post, index) {
  let html = postTemplate;
  
  // Create the output filename
  const filename = `blog-post-${index + 1}.html`;
  
  // Create lastUpdated display string
  const lastUpdatedDisplay = post.lastUpdated && post.lastUpdated !== post.date 
    ? ` (Last updated: ${post.lastUpdated})`
    : '';
  
  // Replace placeholders in the template
  html = html.replace(/{{title}}/g, post.title);
  html = html.replace(/{{date}}/g, post.date);
  html = html.replace(/{{lastUpdatedDisplay}}/g, lastUpdatedDisplay);
  html = html.replace(/{{author}}/g, config.author);
  html = html.replace(/{{content}}/g, post.content);
  html = html.replace(/{{siteTitle}}/g, config.siteTitle);
  html = html.replace(/{{profilePicture}}/g, config.profilePicture);
  html = html.replace(/{{themeColor}}/g, post.themeColor || config.themeColor);
  html = html.replace(/{{filename}}/g, filename);
  
  const outputPath = path.join(config.blogPostsOutputDirectory, filename);
  
  // Write the file
  fs.writeFileSync(outputPath, html);
  
  return {
    filename,
    title: post.title
  };
}

// Generate the index page
function generateIndex(posts) {
  let html = indexTemplate;
  
  // Group posts by lastUpdated or date
  const groupedPosts = {};
  posts.forEach((post, index) => {
    const groupDate = post.lastUpdated || post.date;
    if (!groupedPosts[groupDate]) {
      groupedPosts[groupDate] = [];
    }
    groupedPosts[groupDate].push({ ...post, index });
  });
  
  // Generate the list of blog posts with date grouping
  let postsHTML = '';
  // Sort dates newest first
  const sortedDates = Object.keys(groupedPosts).sort((a, b) => new Date(b) - new Date(a));
  sortedDates.forEach(date => {
    postsHTML += `<h3 class="blog-date-header">${date}</h3>\n`;
    groupedPosts[date].forEach(post => {
      const updatedBadge = post.isUpdated ? '<span class="updated-badge" title="Updated on ' + post.lastUpdated + '">Updated</span>' : '';
      postsHTML += `
        <div class="blog-post-card">
          <a class="blog-post" href="/blog/blog-posts/blog-post-${post.index + 1}.html">
            <h3 class="post-title">${post.title}${updatedBadge ? ' ' + updatedBadge : ''}</h3>
            <p class="post-date">${post.lastUpdated ? 'Updated: ' + post.lastUpdated : 'Posted: ' + post.date}</p>
          </a>
        </div>`;
    });
  });
  
  // Replace placeholders in the template
  html = html.replace(/{{posts}}/g, postsHTML);
  html = html.replace(/{{siteTitle}}/g, config.siteTitle);
  html = html.replace(/{{profilePicture}}/g, config.profilePicture);
  html = html.replace(/{{themeColor}}/g, config.themeColor);
  
  // Write the file
  fs.writeFileSync(path.join(config.outputDirectory, 'index.html'), html);
}

// Main function
function generateBlog() {
  const posts = getAllPosts();
  
  console.log(`Found ${posts.length} blog posts`);
  
  // Generate each post
  const generatedPosts = posts.map((post, index) => {
    return generatePost(post, index);
  });
  
  // Generate the index
  generateIndex(posts);
  
  console.log(`Generated ${generatedPosts.length} blog posts and index`);
}

// Run the generator
if (process.argv.includes('--live')) {
  console.log('Starting in live mode...');
  generateBlog();
  console.log('Watching for changes...');
  
  // Watch posts directory
  fs.watch(config.postsDirectory, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.md')) {
      console.log(`Detected change in ${filename}, rebuilding...`);
      generateBlog();
    }
  });
  
  // Watch templates directory
  fs.watch('templates', { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.html') || filename.endsWith('.md'))) {
      console.log(`Detected change in template ${filename}, rebuilding...`);
      generateBlog();
    }
  });
  
  console.log('Live mode active. Press Ctrl+C to exit.');
} else {
  generateBlog();
}
