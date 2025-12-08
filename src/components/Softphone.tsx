/**
 * Softphone Component
 * 
 * The main phone interface that brings everything together:
 * - Settings panel for SIP configuration
 * - Phone display showing the number being dialed
 * - Call status with caller ID and duration
 * - Dialpad for entering numbers and DTMF
 * - Call controls (call, answer, hangup, mute)
 * 
 * This component manages all the state and coordinates between
 * the SIP service and the UI components.
 */

import React, { useState, useEffect, useCallback } from "react";
import { sipService, type PhoneState, type SipCredentials } from "@/services/sipService";
import { Dialpad } from "./Dialpad";
import { CallControls } from "./CallControls";
import { CallStatus } from "./CallStatus";
import { PhoneDisplay } from "./PhoneDisplay";
import { SettingsPanel } from "./SettingsPanel";
import { toast } from "@/hooks/use-toast";

export function Softphone() {
  // ==================== STATE ====================
  
  // Current phone state (disconnected, registered, in-call, etc.)
  const [phoneState, setPhoneState] = useState<PhoneState>("disconnected");
  
  // The phone number being dialed
  const [dialedNumber, setDialedNumber] = useState("");
  
  // Caller ID for incoming/outgoing calls
  const [callerId, setCallerId] = useState("");
  
  // Whether the microphone is muted
  const [isMuted, setIsMuted] = useState(false);

  // ==================== INITIALIZE SIP SERVICE ====================
  
  useEffect(() => {
    // Set up callbacks so the SIP service can notify us of changes
    sipService.initialize({
      // Called when the phone state changes
      onStateChange: (state) => {
        setPhoneState(state);
        
        // Play a sound on incoming call (browser permitting)
        if (state === "ringing") {
          // You could add a ringtone here
          console.log("Incoming call!");
        }
      },
      
      // Called when caller ID is available
      onCallerId: (id) => {
        setCallerId(id);
      },
      
      // Called when an error occurs
      onError: (error) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      },
    });

    // Cleanup on unmount
    return () => {
      sipService.unregister();
    };
  }, []);

  // ==================== HANDLERS ====================

  /**
   * Connect to the SIP server with the provided credentials
   */
  const handleConnect = useCallback(async (credentials: SipCredentials) => {
    try {
      await sipService.register(credentials);
      toast({
        title: "Connected",
        description: "Successfully registered with SIP server",
      });
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }, []);

  /**
   * Disconnect from the SIP server
   */
  const handleDisconnect = useCallback(async () => {
    await sipService.unregister();
    toast({
      title: "Disconnected",
      description: "Disconnected from SIP server",
    });
  }, []);

  /**
   * Handle dialpad key press
   * - If in a call: send DTMF tone
   * - If not in a call: add digit to the number
   */
  const handleDigit = useCallback(
    (digit: string) => {
      if (phoneState === "in-call") {
        // In a call - send DTMF tone
        sipService.sendDTMF(digit);
        // Optional: show feedback that tone was sent
        toast({
          title: `DTMF: ${digit}`,
          duration: 500,
        });
      } else {
        // Not in a call - add to dialed number
        setDialedNumber((prev) => prev + digit);
      }
    },
    [phoneState]
  );

  /**
   * Delete the last digit from the dialed number
   */
  const handleBackspace = useCallback(() => {
    setDialedNumber((prev) => prev.slice(0, -1));
  }, []);

  /**
   * Make an outbound call
   */
  const handleCall = useCallback(async () => {
    if (!dialedNumber) {
      toast({
        title: "Enter a number",
        description: "Please enter a phone number or SIP address",
        variant: "destructive",
      });
      return;
    }

    try {
      await sipService.call(dialedNumber);
      // Clear the dialed number after initiating the call
      setDialedNumber("");
    } catch (error) {
      console.error("Call failed:", error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to make call",
        variant: "destructive",
      });
    }
  }, [dialedNumber]);

  /**
   * Answer an incoming call
   */
  const handleAnswer = useCallback(async () => {
    try {
      await sipService.answer();
    } catch (error) {
      console.error("Answer failed:", error);
    }
  }, []);

  /**
   * Hang up the current call
   */
  const handleHangup = useCallback(async () => {
    await sipService.hangup();
    setIsMuted(false);
  }, []);

  /**
   * Toggle microphone mute
   */
  const handleMute = useCallback(() => {
    const newMuteState = sipService.toggleMute();
    setIsMuted(newMuteState);
  }, []);

  // ==================== RENDER ====================

  // Determine if we're in an active call state
  const isCallActive = phoneState === "calling" || phoneState === "in-call" || phoneState === "ringing";

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      {/* Settings panel for SIP configuration */}
      <SettingsPanel
        state={phoneState}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Main phone UI */}
      <div className="phone-container rounded-2xl overflow-hidden">
        {/* Call status - shows connection state, caller ID, duration */}
        <CallStatus state={phoneState} callerId={callerId} />

        {/* Phone number display - only show when not in a call */}
        {!isCallActive && (
          <PhoneDisplay
            number={dialedNumber}
            onBackspace={handleBackspace}
            disabled={phoneState === "disconnected"}
          />
        )}

        {/* Dialpad */}
        <Dialpad
          onDigit={handleDigit}
          // Disable dialpad when disconnected (except in-call for DTMF)
          disabled={phoneState === "disconnected" || phoneState === "connecting"}
        />

        {/* Call controls - call, answer, hangup, mute buttons */}
        <CallControls
          state={phoneState}
          isMuted={isMuted}
          onCall={handleCall}
          onAnswer={handleAnswer}
          onHangup={handleHangup}
          onMute={handleMute}
          callDisabled={!dialedNumber}
        />
      </div>
    </div>
  );
}
