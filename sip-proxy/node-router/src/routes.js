/**
 * Routing Logic Module
 * ====================
 * 
 * This module contains the routing rules for determining which
 * Asterisk server should handle a given call.
 * 
 * CURRENT ROUTING STRATEGY:
 * - Extensions 1000-1999 go to Asterisk 1
 * - Extensions 2000-2999 go to Asterisk 2
 * - Unknown extensions return null (no route)
 * 
 * CUSTOMIZATION IDEAS:
 * 1. Database lookup: Store user->server mappings in Redis/PostgreSQL
 * 2. Load balancing: Round-robin or least-connections between servers
 * 3. Time-based routing: Route to different servers by time of day
 * 4. Geographic routing: Route based on caller location
 * 5. Priority routing: VIP users get dedicated servers
 */

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

/**
 * List of available Asterisk servers
 * Each server has a name, host, port, and extension ranges it handles
 */
const SERVERS = [
  {
    name: 'asterisk-1',
    host: process.env.ASTERISK_1_HOST || 'asterisk-1',
    port: parseInt(process.env.ASTERISK_1_PORT, 10) || 5060,
    // This server handles extensions 1000-1999
    extensionRange: { min: 1000, max: 1999 },
    // Track server health (in production, use actual health checks)
    healthy: true
  },
  {
    name: 'asterisk-2',
    host: process.env.ASTERISK_2_HOST || 'asterisk-2',
    port: parseInt(process.env.ASTERISK_2_PORT, 10) || 5060,
    // This server handles extensions 2000-2999
    extensionRange: { min: 2000, max: 2999 },
    healthy: true
  }
];

// =============================================================================
// ROUTING FUNCTIONS
// =============================================================================

/**
 * Get the route for a given called number
 * 
 * @param {string} called - The number being called (e.g., "1001")
 * @param {string} caller - The calling number (optional, for future use)
 * @returns {object|null} - Route object with host/port, or null if no route
 * 
 * Example return: { host: 'asterisk-1', port: 5060 }
 */
function getRoute(called, caller) {
  // Convert called number to integer for range checking
  const extension = parseInt(called, 10);
  
  // If it's not a valid number, can't route by extension range
  if (isNaN(extension)) {
    console.log(`  Called number "${called}" is not numeric, trying fallback`);
    return getFallbackRoute(called);
  }
  
  // Find a server that handles this extension range
  for (const server of SERVERS) {
    if (!server.healthy) {
      console.log(`  Skipping ${server.name} (unhealthy)`);
      continue;
    }
    
    const { min, max } = server.extensionRange;
    
    if (extension >= min && extension <= max) {
      return {
        host: server.host,
        port: server.port
      };
    }
  }
  
  // No server found for this extension
  console.log(`  No server handles extension ${extension}`);
  return null;
}

/**
 * Fallback routing for non-numeric destinations
 * This handles SIP URIs, domain names, etc.
 * 
 * @param {string} called - The called destination
 * @returns {object|null} - Route or null
 */
function getFallbackRoute(called) {
  // Example: Route all unknown destinations to asterisk-1
  // In production, you might want different logic here
  
  const defaultServer = SERVERS.find(s => s.healthy);
  
  if (defaultServer) {
    console.log(`  Using fallback server: ${defaultServer.name}`);
    return {
      host: defaultServer.host,
      port: defaultServer.port
    };
  }
  
  return null;
}

/**
 * Get health status of all servers
 * 
 * @returns {array} - Array of server health status objects
 */
function getServerHealth() {
  return SERVERS.map(server => ({
    name: server.name,
    host: server.host,
    port: server.port,
    healthy: server.healthy,
    extensionRange: `${server.extensionRange.min}-${server.extensionRange.max}`
  }));
}

/**
 * Update server health status
 * In production, this would be called by a health check process
 * 
 * @param {string} serverName - Name of the server to update
 * @param {boolean} healthy - New health status
 */
function setServerHealth(serverName, healthy) {
  const server = SERVERS.find(s => s.name === serverName);
  if (server) {
    server.healthy = healthy;
    console.log(`Server ${serverName} health set to: ${healthy}`);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getRoute,
  getServerHealth,
  setServerHealth,
  SERVERS
};
