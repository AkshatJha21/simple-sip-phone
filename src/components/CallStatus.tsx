/**
 * Call Status Component
 * 
 * Displays:
 * - Connection status (with colored indicator dot)
 * - Caller ID when in a call
 * - Call duration timer
 * - Status text (Ringing, Calling, In Call, etc.)
 */

import React, { useEffect, useState } from "react";
import type { PhoneState } from "@/services/sipService";

interface CallStatusProps {
  // Current phone state
  state: PhoneState;
  // Caller ID (phone number or SIP address)
  callerId: string;
}

/**
 * Format seconds into MM:SS display
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  // Pad with zeros: 0:05, 1:30, etc.
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get the status dot CSS class based on phone state
 */
function getStatusDotClass(state: PhoneState): string {
  switch (state) {
    case "registered":
      return "online";
    case "connecting":
      return "connecting";
    case "in-call":
    case "calling":
    case "ringing":
      return "in-call";
    default:
      return "offline";
  }
}

/**
 * Get human-readable status text
 */
function getStatusText(state: PhoneState): string {
  switch (state) {
    case "disconnected":
      return "Offline";
    case "connecting":
      return "Connecting...";
    case "registered":
      return "Ready";
    case "ringing":
      return "Incoming Call";
    case "calling":
      return "Calling...";
    case "in-call":
      return "In Call";
    default:
      return "Unknown";
  }
}

export function CallStatus({ state, callerId }: CallStatusProps) {
  // Track call duration
  const [duration, setDuration] = useState(0);

  // Start/stop the call timer based on state
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (state === "in-call") {
      // Reset and start counting when call connects
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Reset when not in a call
      setDuration(0);
    }

    // Cleanup: stop the timer when component unmounts or state changes
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [state]);

  // Determine if we should show the caller ID section
  const showCallInfo = state === "ringing" || state === "calling" || state === "in-call";

  return (
    <div className="text-center py-4">
      {/* Status indicator with dot */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`status-dot ${getStatusDotClass(state)}`} />
        <span className="text-sm text-muted-foreground">
          {getStatusText(state)}
        </span>
      </div>

      {/* Caller ID and duration - only shown during calls */}
      {showCallInfo && (
        <div className="space-y-2">
          {/* Caller ID - uses monospace font for phone numbers */}
          <div className="font-display text-xl text-foreground">
            {callerId || "Unknown"}
          </div>

          {/* Duration - only show when actually in a call */}
          {state === "in-call" && (
            <div className="font-display text-lg text-primary tabular-nums">
              {formatDuration(duration)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
