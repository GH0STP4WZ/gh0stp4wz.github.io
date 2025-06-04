// blog-generator.js
const fs = require('fs');
const path = require('path');
const marked = require('marked');

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
    
    // Remove frontmatter for content
    const markdownContent = content.split('---')[2].trim();
    
    return {
      title,
      date,
      content: marked.parse(markdownContent),
      themeColor
    };
  }).sort((a, b) => {
    // Sort by date (newest first)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
}

// Generate an individual blog post
function generatePost(post, index) {
  let html = postTemplate;
  
  // Replace placeholders in the template
  html = html.replace(/{{title}}/g, post.title);
  html = html.replace(/{{date}}/g, post.date);
  html = html.replace(/{{author}}/g, config.author);
  html = html.replace(/{{content}}/g, post.content);
  html = html.replace(/{{siteTitle}}/g, config.siteTitle);
  html = html.replace(/{{profilePicture}}/g, config.profilePicture);
  html = html.replace(/{{themeColor}}/g, post.themeColor || config.themeColor);
  
  // Create the output filename
  const filename = `blog-post-${index + 1}.html`;
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
  
  // Generate the list of blog posts
  const postsHTML = posts.map((post, index) => {
    return `
        <div class="blog-post-card">
          <a class="blog-post" href="/blog/blog-posts/blog-post-${index + 1}.html">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-date">${post.date}</p>
          </a>
        </div>`;
  }).join('\n');
  
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
generateBlog();
