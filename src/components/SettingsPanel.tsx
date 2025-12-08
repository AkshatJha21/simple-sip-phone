/**
 * Settings Panel Component
 * 
 * A collapsible panel for configuring SIP credentials:
 * - SIP Username
 * - SIP Password
 * - SIP Domain (server)
 * - WebSocket URL
 * 
 * Also shows connection status and connect/disconnect buttons
 */

import React, { useState } from "react";
import { Settings, ChevronDown, ChevronUp, Wifi, WifiOff } from "lucide-react";
import type { SipCredentials, PhoneState } from "@/services/sipService";

interface SettingsPanelProps {
  // Current phone state
  state: PhoneState;
  // Called when user wants to connect
  onConnect: (credentials: SipCredentials) => void;
  // Called when user wants to disconnect
  onDisconnect: () => void;
}

// Default values for common public SIP providers
// Users can change these for their own SIP server
const DEFAULT_CREDENTIALS: SipCredentials = {
  username: "",
  password: "",
  domain: "sip.example.com",
  wsServer: "wss://sip.example.com:8089/ws",
};

export function SettingsPanel({
  state,
  onConnect,
  onDisconnect,
}: SettingsPanelProps) {
  // Track if the panel is expanded
  const [isOpen, setIsOpen] = useState(true);
  
  // Form state for SIP credentials
  const [credentials, setCredentials] = useState<SipCredentials>(DEFAULT_CREDENTIALS);

  // Handle form submission
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.username || !credentials.password || !credentials.domain || !credentials.wsServer) {
      alert("Please fill in all fields");
      return;
    }
    
    onConnect(credentials);
  };

  // Determine if we're connected
  const isConnected = state !== "disconnected" && state !== "connecting";

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header - always visible, click to toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-foreground">SIP Settings</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          {isConnected ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-muted-foreground" />
          )}
          {/* Expand/collapse icon */}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <form onSubmit={handleConnect} className="p-4 pt-0 space-y-4">
          {/* Username field */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-muted-foreground">
              SIP Username
            </label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              placeholder="e.g., 1001 or user"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              SIP Password
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              placeholder="Your SIP password"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          {/* Domain field */}
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm text-muted-foreground">
              SIP Domain
            </label>
            <input
              id="domain"
              type="text"
              value={credentials.domain}
              onChange={(e) =>
                setCredentials({ ...credentials, domain: e.target.value })
              }
              placeholder="e.g., sip.provider.com"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          {/* WebSocket Server field */}
          <div className="space-y-2">
            <label htmlFor="wsServer" className="text-sm text-muted-foreground">
              WebSocket Server
            </label>
            <input
              id="wsServer"
              type="text"
              value={credentials.wsServer}
              onChange={(e) =>
                setCredentials({ ...credentials, wsServer: e.target.value })
              }
              placeholder="e.g., wss://sip.provider.com:8089/ws"
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isConnected}
            />
          </div>

          {/* Connect/Disconnect button */}
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="w-full py-2 px-4 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="submit"
              disabled={state === "connecting"}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {state === "connecting" ? "Connecting..." : "Connect"}
            </button>
          )}

          {/* Help text */}
          <p className="text-xs text-muted-foreground text-center">
            Works with Asterisk, FreeSWITCH, or any WebRTC-enabled SIP provider
          </p>
        </form>
      )}
    </div>
  );
}
