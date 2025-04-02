const http = require('http');
const fs = require('fs');
const path = require('path');

// Add a function to get client IP address
const getClientIP = (req) => {
  let ip = req.headers['x-forwarded-for'];
  if (ip) {
    // Return the first IP if x-forwarded-for header contains multiple IPs
    ip = ip.split(',')[0].trim();
  } else {
    // Return direct connection IP (or local socket address as fallback)
    ip = req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
  }
  
  // Clean IPv4-mapped IPv6 addresses (convert ::ffff:127.0.0.1 to 127.0.0.1)
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
};

// Function to log access to a file
const logAccess = (ip, url) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] IP: ${ip} - URL: ${url}\n`;
  
  // Append to access.log file
  fs.appendFile('./access.log', logEntry, (err) => {
    if (err) {
      console.error('Error writing to access log:', err);
    }
  });
};

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Replace the hardcoded port with a dynamic one that checks command line arguments
const port = process.argv[2] || 8081;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  const clientIP = getClientIP(req);
  console.log(`Request: ${clientIP} ${req.url}`);
  
  // Log the access to file
  logAccess(clientIP, req.url);
  
  // Handle root request
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // Get file extension
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read and serve the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        fs.readFile('./index.html', (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Press Ctrl+C to stop the server`);
  console.log(`Access logs are being saved to ./access.log`);
});
