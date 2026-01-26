/**
 * SIP Router API - Main Entry Point
 * ==================================
 * 
 * This Express server provides routing decisions to Kamailio.
 * When Kamailio receives a call, it queries this API to determine
 * which Asterisk server should handle the call.
 * 
 * HOW IT WORKS:
 * 1. Kamailio receives INVITE (call request)
 * 2. Kamailio sends HTTP POST to /route with caller/called info
 * 3. This API returns the destination Asterisk server
 * 4. Kamailio forwards the call to that server
 * 
 * EXTENDING:
 * - Add database lookups for user locations
 * - Implement load balancing between servers
 * - Add authentication/authorization checks
 * - Implement number translation/manipulation
 */

const express = require('express');
const { getRoute, getServerHealth } = require('./routes.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body));
  }
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /route
 * 
 * Main routing endpoint. Kamailio calls this to determine where to send a call.
 * 
 * Request body:
 *   { "called": "1001", "caller": "1002" }
 * 
 * Response:
 *   { "host": "asterisk-1", "port": 5060 }
 */
app.post('/route', (req, res) => {
  const { called, caller } = req.body;
  
  if (!called) {
    console.error('Missing "called" in request body');
    return res.status(400).json({ error: 'Missing called number' });
  }
  
  console.log(`Routing call: ${caller || 'unknown'} -> ${called}`);
  
  // Get the routing decision
  const route = getRoute(called, caller);
  
  if (!route) {
    console.log(`  No route found for ${called}`);
    return res.status(404).json({ error: 'No route found' });
  }
  
  console.log(`  Routing to: ${route.host}:${route.port}`);
  res.json(route);
});

/**
 * GET /health
 * 
 * Health check endpoint. Returns status of all Asterisk servers.
 */
app.get('/health', (req, res) => {
  const health = getServerHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    servers: health
  });
});

/**
 * GET /
 * 
 * Basic info endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'SIP Router API',
    version: '1.0.0',
    endpoints: {
      'POST /route': 'Get routing decision for a call',
      'GET /health': 'Check server health'
    }
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('SIP Router API');
  console.log('='.repeat(60));
  console.log(`Server listening on port ${PORT}`);
  console.log('');
  console.log('Configured Asterisk servers:');
  console.log(`  - asterisk-1: ${process.env.ASTERISK_1_HOST || 'asterisk-1'}:${process.env.ASTERISK_1_PORT || 5060}`);
  console.log(`  - asterisk-2: ${process.env.ASTERISK_2_HOST || 'asterisk-2'}:${process.env.ASTERISK_2_PORT || 5060}`);
  console.log('');
  console.log('Routing rules:');
  console.log('  - Extensions 1000-1999 -> asterisk-1');
  console.log('  - Extensions 2000-2999 -> asterisk-2');
  console.log('='.repeat(60));
});
