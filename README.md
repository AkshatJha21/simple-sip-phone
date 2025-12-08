# SIP Softphone

A simple, browser-based SIP softphone built with React and SIP.js. Make and receive VoIP calls directly from your browser.

## Features

- ✅ SIP registration with any WebRTC-enabled SIP server
- ✅ Make outbound calls
- ✅ Receive incoming calls
- ✅ Hang up calls
- ✅ Mute/unmute microphone
- ✅ DTMF tone sending (for IVR menus)
- ✅ Call timer
- ✅ Caller ID display
- ✅ Clean, responsive UI

## Project Structure

```
src/
├── components/
│   ├── Softphone.tsx      # Main phone component (orchestrates everything)
│   ├── Dialpad.tsx        # Phone dialpad (0-9, *, #)
│   ├── CallControls.tsx   # Call/Answer/Hangup/Mute buttons
│   ├── CallStatus.tsx     # Status indicator, caller ID, call timer
│   ├── PhoneDisplay.tsx   # Shows the number being dialed
│   └── SettingsPanel.tsx  # SIP credentials configuration
├── services/
│   └── sipService.ts      # SIP.js wrapper - handles all SIP communication
├── pages/
│   └── Index.tsx          # Main page
└── index.css              # Design system and styles
```

## How It Works

### The Flow

1. **User enters SIP credentials** in the Settings Panel
2. **Click "Connect"** → sipService creates a SIP.js UserAgent and registers with the server
3. **Enter a number** → digits appear in the Phone Display
4. **Click the call button** → sipService creates an Inviter and sends INVITE
5. **Other party answers** → audio streams connect, call timer starts
6. **Click hangup** → sipService sends BYE, call ends

### Key Components

#### `sipService.ts`
The heart of the application. This service:
- Wraps SIP.js to provide a simple API
- Manages the UserAgent (your "phone")
- Handles registration with the SIP server
- Creates and manages call sessions
- Sends DTMF tones
- Controls audio muting

#### `Softphone.tsx`
The main UI component that:
- Initializes the SIP service on mount
- Manages all phone state (connected, in-call, etc.)
- Coordinates between user actions and SIP service
- Displays appropriate UI based on current state

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8080 in your browser
```

## SIP Server Requirements

This softphone works with any SIP server that supports:
- **WebSocket transport** (required for browser-based SIP)
- **WebRTC** for audio/video

### Popular Compatible Servers

1. **Asterisk** (with WebRTC enabled)
   - Enable `http_websocket` module
   - Configure WSS endpoint
   - Example WebSocket URL: `wss://your-asterisk.com:8089/ws`

2. **FreeSWITCH**
   - Enable `mod_verto` or `mod_sofia` with WebSocket
   - Example WebSocket URL: `wss://your-freeswitch.com:7443`

3. **Public SIP Providers** (for testing)
   - Many VoIP providers now offer WebRTC support
   - Check if your provider supports SIP over WebSocket

### Example Asterisk Configuration

In `http.conf`:
```ini
[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
tlsenable=yes
tlsbindaddr=0.0.0.0:8089
tlscertfile=/path/to/cert.pem
tlsprivatekey=/path/to/key.pem
```

In `pjsip.conf`:
```ini
[transport-wss]
type=transport
protocol=wss
bind=0.0.0.0

[your-extension]
type=endpoint
context=default
disallow=all
allow=opus
allow=ulaw
webrtc=yes
```

## Browser Permissions

The softphone requires microphone access. When you make your first call, the browser will ask for permission. You must allow it for audio to work.

## Limitations

- **No video support** (audio only for simplicity)
- **Basic NAT traversal** (uses SIP.js defaults; may need STUN/TURN for complex networks)
- **No encryption setup** beyond what SIP.js provides by default
- **Single call only** (no call waiting or multiple lines)

## Troubleshooting

### "Failed to register"
- Check your SIP credentials
- Verify the WebSocket URL is correct and accessible
- Ensure your SIP server has WebSocket/WebRTC enabled

### No audio
- Check browser microphone permissions
- Verify STUN/TURN servers if behind strict NAT
- Check browser console for WebRTC errors

### Call connects but no sound
- Audio may be blocked by browser autoplay policies
- Try clicking somewhere on the page before answering

## Technologies Used

- **React** - UI framework
- **SIP.js** - SIP/WebRTC library
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **TypeScript** - Type safety (used throughout despite being "simple")

## License

MIT
