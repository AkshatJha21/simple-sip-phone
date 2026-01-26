# SIP Proxy Server - Kamailio + Node.js

A complete SIP proxy setup using Kamailio for SIP routing and Node.js for dynamic routing decisions.

## Architecture

```
┌──────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Softphone   │─────▶│    Kamailio     │─────▶│  Asterisk #1    │
│  (Browser)   │◀─────│   (SIP Proxy)   │      │  (ext 1000-1999)│
└──────────────┘      │                 │      └─────────────────┘
                      │   ┌─────────┐   │      ┌─────────────────┐
                      │   │ HTTP    │   │─────▶│  Asterisk #2    │
                      │   │ Query   │   │      │  (ext 2000-2999)│
                      │   └────┬────┘   │      └─────────────────┘
                      └────────┼────────┘
                               │
                      ┌────────▼────────┐
                      │    Node.js      │
                      │   Router API    │
                      └─────────────────┘
```

## Quick Start

### 1. Start the Stack

```bash
cd sip-proxy
docker-compose up -d
```

### 2. Verify Services are Running

```bash
# Check all containers are up
docker-compose ps

# Check Node.js router health
curl http://localhost:3000/health
```

### 3. Configure Your Softphone

Point your softphone to connect through Kamailio:

| Setting | Value |
|---------|-------|
| SIP Server | `localhost` (or your server IP) |
| WebSocket | `ws://localhost:8080` |
| Username | `1001` (or any configured extension) |
| Password | `secret1001` (matches pjsip.conf) |

## How It Works

### Call Flow

1. **Softphone registers** with Kamailio (port 5060/8080)
2. **Kamailio forwards registration** to the appropriate Asterisk
3. **User dials a number** (e.g., 2001)
4. **Kamailio receives INVITE** and queries Node.js router
5. **Node.js returns routing decision** (e.g., asterisk-2:5060)
6. **Kamailio forwards the call** to that Asterisk server
7. **Asterisk handles media** (audio) between the parties

### Routing Rules (Default)

| Extension Range | Destination |
|-----------------|-------------|
| 1000-1999 | asterisk-1 |
| 2000-2999 | asterisk-2 |

## File Structure

```
sip-proxy/
├── docker-compose.yml      # Orchestrates all services
├── kamailio/
│   ├── Dockerfile          # Kamailio image
│   └── kamailio.cfg        # SIP routing configuration
├── node-router/
│   ├── Dockerfile          # Node.js image
│   ├── package.json
│   └── src/
│       ├── index.js        # Express server
│       └── routes.js       # Routing logic
├── asterisk-1/
│   ├── pjsip.conf          # SIP accounts 1000-1999
│   └── extensions.conf     # Dialplan
├── asterisk-2/
│   ├── pjsip.conf          # SIP accounts 2000-2999
│   └── extensions.conf     # Dialplan
└── README.md
```

## Customizing Routing

Edit `node-router/src/routes.js` to change routing logic:

```javascript
// Example: Add a new server
const SERVERS = [
  {
    name: 'asterisk-1',
    host: 'asterisk-1',
    port: 5060,
    extensionRange: { min: 1000, max: 1999 }
  },
  {
    name: 'asterisk-2',
    host: 'asterisk-2',
    port: 5060,
    extensionRange: { min: 2000, max: 2999 }
  },
  // Add your new server here
  {
    name: 'asterisk-3',
    host: 'asterisk-3',
    port: 5060,
    extensionRange: { min: 3000, max: 3999 }
  }
];
```

## API Endpoints

### POST /route

Get routing decision for a call.

**Request:**
```json
{
  "called": "2001",
  "caller": "1001"
}
```

**Response:**
```json
{
  "host": "asterisk-2",
  "port": 5060
}
```

### GET /health

Check server health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "servers": [
    {
      "name": "asterisk-1",
      "host": "asterisk-1",
      "port": 5060,
      "healthy": true,
      "extensionRange": "1000-1999"
    }
  ]
}
```

## Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f kamailio
docker-compose logs -f node-router
docker-compose logs -f asterisk-1
```

## Adding New Extensions

1. Edit the appropriate `pjsip.conf` file
2. Add the endpoint, auth, and aor sections
3. Restart the Asterisk container:

```bash
docker-compose restart asterisk-1
```

## Production Considerations

### Security

- [ ] Enable TLS for SIP (port 5061)
- [ ] Use strong passwords
- [ ] Implement rate limiting in Node.js
- [ ] Add authentication to the routing API
- [ ] Configure firewall rules

### Performance

- [ ] Add Redis for user location caching
- [ ] Implement connection pooling
- [ ] Add health checks with automatic failover
- [ ] Consider Kamailio's dispatcher module for load balancing

### Monitoring

- [ ] Add Prometheus metrics endpoint
- [ ] Set up Grafana dashboards
- [ ] Configure log aggregation (ELK stack)
- [ ] Add alerting for server failures

## Troubleshooting

### Kamailio won't start

Check the config syntax:
```bash
docker-compose run kamailio kamailio -c /etc/kamailio/kamailio.cfg
```

### Calls not routing

1. Check Node.js router is responding:
   ```bash
   curl -X POST http://localhost:3000/route \
     -H "Content-Type: application/json" \
     -d '{"called":"2001","caller":"1001"}'
   ```

2. Check Kamailio logs for routing queries

### No audio

- Ensure Asterisk containers can reach each other
- Check that RTP ports are not blocked
- Verify STUN/TURN configuration for WebRTC clients

## License

MIT
