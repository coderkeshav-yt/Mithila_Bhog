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