// CORSProxy Server - Second-Me Windows
const express = require('express');
const httpProxy = require('http-proxy-middleware');
const createProxyMiddleware = httpProxy.createProxyMiddleware;

// Load environment variables
const BACKEND_PORT = process.env.BACKEND_PORT || 8002;
const CORS_PORT = process.env.CORS_PORT || 8003;

console.log('Environment settings:');
console.log(`  Backend port: ${BACKEND_PORT}`);
console.log(`  CORS proxy port: ${CORS_PORT}`);

const app = express();

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Proxy API requests to backend
const apiProxy = createProxyMiddleware({
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api',  // No path rewriting
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add request headers if needed
    proxyReq.setHeader('X-Forwarded-By', 'CORS-Proxy');
    
    // Debug logging
    console.log(`Proxy request: ${req.method} ${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';
    
    // Log response status
    console.log(`Backend response: ${proxyRes.statusCode} ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'Could not connect to backend service. Please check if the service is running.',
      code: 'ECONNREFUSED'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'cors-proxy',
    timestamp: new Date().toISOString()
  });
});

// Set up proxy middleware
app.use('/api', apiProxy);
app.use('/', apiProxy);  // Also proxy requests to root path

// Start server
app.listen(CORS_PORT, () => {
  console.log(`CORS Proxy running on port ${CORS_PORT}`);
  console.log(`Connecting to backend at: http://localhost:${BACKEND_PORT}`);
  console.log('Allowing CORS requests from all origins');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down CORS proxy...');
  process.exit(0);
});
