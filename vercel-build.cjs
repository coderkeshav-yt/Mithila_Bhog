const fs = require('fs');
const path = require('path');

// Path to the build directory
const buildDir = path.join(__dirname, 'dist');

// Copy index.html to 200.html
if (fs.existsSync(path.join(buildDir, 'index.html'))) {
  const indexHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(buildDir, '200.html'), indexHtml);
  console.log('Created 200.html as a copy of index.html');
} else {
  console.error('index.html not found in build directory');
}

// Ensure _redirects file exists
fs.writeFileSync(path.join(buildDir, '_redirects'), '/* /index.html 200');
console.log('Created _redirects file');

// Create _headers file for Vercel
const headersContent = `
# All JavaScript files
/assets/*.js
  Content-Type: application/javascript
  X-Content-Type-Options: nosniff

# All CSS files
/assets/*.css
  Content-Type: text/css
  X-Content-Type-Options: nosniff

# All routes should fallback to index.html
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
`;

fs.writeFileSync(path.join(buildDir, '_headers'), headersContent.trim());
console.log('Created _headers file for content type configuration'); 