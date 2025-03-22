// CORS Anywhere - A simple proxy to add CORS headers to any API response
// This allows our frontend to communicate with our backend if CORS headers are missing
// Source: https://github.com/Rob--W/cors-anywhere

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8003; // Different from both backend and frontend

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE');
  res.header('Access-Control-Allow-Headers', req.header('access-control-request-headers'));
  
  if (req.method === 'OPTIONS') {
    return res.send();
  }
  
  next();
});

// Proxy all requests to the backend
const backendUrl = 'http://localhost:8002'; // Backend URL

app.use('/', createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  onProxyRes: function(proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, PUT, PATCH, POST, DELETE';
  }
}));

app.listen(port, () => {
  console.log(`CORS proxy running at http://localhost:${port}`);
});
