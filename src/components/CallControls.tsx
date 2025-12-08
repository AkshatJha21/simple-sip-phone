/**
 * Call Controls Component
 * 
 * The action buttons for managing calls:
 * - Call/Answer button (green)
 * - Hangup button (red)
 * - Mute button (toggles)
 * 
 * The visible buttons change based on the current phone state
 */

import React from "react";
import { Phone, PhoneOff, Mic, MicOff, PhoneIncoming } from "lucide-react";
import type { PhoneState } from "@/services/sipService";

interface CallControlsProps {
  // Current state of the phone
  state: PhoneState;
  // Whether the mic is muted
  isMuted: boolean;
  // Called when user wants to make a call
  onCall: () => void;
  // Called when user wants to answer an incoming call
  onAnswer: () => void;
  // Called when user wants to hang up
  onHangup: () => void;
  // Called when user wants to toggle mute
  onMute: () => void;
  // Whether the call button should be disabled (e.g., empty number)
  callDisabled?: boolean;
}

export function CallControls({
  state,
  isMuted,
  onCall,
  onAnswer,
  onHangup,
  onMute,
  callDisabled = false,
}: CallControlsProps) {
  // Different UI based on phone state
  const renderControls = () => {
    switch (state) {
      // When registered and ready, show the call button
      case "registered":
      case "disconnected":
        return (
          <div className="flex justify-center">
            <button
              className={`call-btn call-btn-answer ${
                callDisabled || state === "disconnected"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={onCall}
              disabled={callDisabled || state === "disconnected"}
              aria-label="Make call"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        );

      // When ringing (incoming call), show answer and reject buttons
      case "ringing":
        return (
          <div className="flex justify-center gap-8">
            {/* Reject button */}
            <button
              className="call-btn call-btn-hangup"
              onClick={onHangup}
              aria-label="Reject call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            {/* Answer button - with pulsing animation */}
            <button
              className="call-btn call-btn-answer ringing"
              onClick={onAnswer}
              aria-label="Answer call"
            >
              <PhoneIncoming className="w-6 h-6" />
            </button>
          </div>
        );

      // When calling or in-call, show mute and hangup
      case "calling":
      case "in-call":
        return (
          <div className="flex justify-center gap-6">
            {/* Mute button */}
            <button
              className={`call-btn call-btn-mute ${isMuted ? "active" : ""}`}
              onClick={onMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
            {/* Hangup button */}
            <button
              className="call-btn call-btn-hangup"
              onClick={onHangup}
              aria-label="Hang up"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        );

      // Connecting state - show disabled call button
      case "connecting":
        return (
          <div className="flex justify-center">
            <button
              className="call-btn call-btn-answer opacity-50 cursor-not-allowed"
              disabled
              aria-label="Connecting..."
            >
              <Phone className="w-6 h-6 animate-pulse" />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="py-4">{renderControls()}</div>;
}
