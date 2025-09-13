#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DEMO_DIR = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.mp4': 'video/mp4',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.css': 'text/css',
  '.js': 'text/javascript'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DEMO_DIR, req.url === '/' ? 'view-demo.html' : req.url);
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
🎬 Fisher Backflows Demo Server Running!
========================================

📱 View the demo at:
   http://localhost:${PORT}

🌐 Or from your phone's browser:
   http://127.0.0.1:${PORT}

Press Ctrl+C to stop the server
`);
});