/**
 * SIP Service - Handles all SIP/VoIP communication using SIP.js
 * 
 * This service wraps the SIP.js library to provide a simple API for:
 * - Registering with a SIP server
 * - Making outbound calls
 * - Receiving inbound calls
 * - Call control (hangup, mute, DTMF)
 * 
 * HOW IT WORKS:
 * 1. UserAgent: The main SIP.js object that represents your phone
 * 2. Registerer: Tells the SIP server "I'm online, send calls to me"
 * 3. Inviter: Used to make outbound calls
 * 4. Session: Represents an active call (inbound or outbound)
 */

import {
  UserAgent,
  Registerer,
  RegistererState,
  Inviter,
  SessionState,
  Session,
  UserAgentOptions,
  Invitation,
} from "sip.js";

// SIP credentials needed to connect to a SIP server
export interface SipCredentials {
  // Your SIP username (e.g., "1001" or "user@domain.com")
  username: string;
  // Your SIP password
  password: string;
  // The SIP server domain (e.g., "sip.example.com")
  domain: string;
  // WebSocket server URL (e.g., "wss://sip.example.com:8089/ws")
  wsServer: string;
}

// Current state of the phone
export type PhoneState = 
  | "disconnected"    // Not connected to SIP server
  | "connecting"      // Trying to connect
  | "registered"      // Connected and ready to make/receive calls
  | "ringing"         // Incoming call ringing
  | "calling"         // Outbound call in progress (ringing on other end)
  | "in-call";        // Active call

// Callbacks to notify the UI of state changes
export interface SipCallbacks {
  onStateChange: (state: PhoneState) => void;
  onCallerId: (callerId: string) => void;
  onError: (error: string) => void;
}

/**
 * The SIP Service class - manages all SIP communication
 */
class SipService {
  // The main SIP.js user agent (your "phone")
  private userAgent: UserAgent | null = null;
  
  // Handles registration with the SIP server
  private registerer: Registerer | null = null;
  
  // The current active call session
  private currentSession: Session | null = null;
  
  // Callbacks to notify UI of changes
  private callbacks: SipCallbacks | null = null;
  
  // Track mute state
  private isMuted: boolean = false;
  
  // Audio elements for remote audio playback
  private remoteAudio: HTMLAudioElement | null = null;

  /**
   * Initialize the SIP service with callbacks
   * Call this once when the app starts
   */
  initialize(callbacks: SipCallbacks) {
    this.callbacks = callbacks;
    
    // Create an audio element for playing remote audio (the other person's voice)
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
  }

  /**
   * Connect and register with a SIP server
   * This makes your phone "online" and able to receive calls
   */
  async register(credentials: SipCredentials): Promise<void> {
    this.callbacks?.onStateChange("connecting");

    try {
      // Build the SIP URI (like a phone number address)
      // Format: sip:username@domain
      const uri = UserAgent.makeURI(`sip:${credentials.username}@${credentials.domain}`);
      
      if (!uri) {
        throw new Error("Invalid SIP URI - check your username and domain");
      }

      // Configure the UserAgent (your phone)
      const userAgentOptions: UserAgentOptions = {
        uri,
        // The WebSocket server is how we connect to the SIP server from a browser
        transportOptions: {
          server: credentials.wsServer,
        },
        // Authentication credentials
        authorizationUsername: credentials.username,
        authorizationPassword: credentials.password,
        // Handle incoming calls
        delegate: {
          onInvite: (invitation: Invitation) => {
            console.log("[SIP] Incoming call received!", invitation);
            this.handleIncomingCall(invitation);
          },
        },
        // Log level (set to "debug" for troubleshooting)
        logLevel: "debug",
      };

      // Create the UserAgent
      this.userAgent = new UserAgent(userAgentOptions);
      console.log("[SIP] UA contact:", this.userAgent.contact.uri.toString());

      // Start the UserAgent (connects the WebSocket)
      await this.userAgent.start();

      // Create a Registerer to tell the server we're online
      this.registerer = new Registerer(this.userAgent);

      // Listen for registration state changes
      this.registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Registered:
            // Successfully registered - we can now make and receive calls
            this.callbacks?.onStateChange("registered");
            break;
          case RegistererState.Unregistered:
            this.callbacks?.onStateChange("disconnected");
            break;
        }
      });

      // Actually register with the server
      await this.registerer.register();

    } catch (error) {
      this.callbacks?.onStateChange("disconnected");
      this.callbacks?.onError(
        error instanceof Error ? error.message : "Failed to register with SIP server"
      );
      throw error;
    }
  }

  /**
   * Disconnect from the SIP server
   */
  async unregister(): Promise<void> {
    try {
      // Hang up any active call first
      if (this.currentSession) {
        await this.hangup();
      }
      
      // Unregister from the server
      if (this.registerer) {
        await this.registerer.unregister();
      }
      
      // Stop the UserAgent
      if (this.userAgent) {
        await this.userAgent.stop();
        this.userAgent = null;
      }
      
      this.callbacks?.onStateChange("disconnected");
    } catch (error) {
      this.callbacks?.onError("Failed to disconnect cleanly");
    }
  }

  /**
   * Make an outbound call to a phone number or SIP address
   */
  async call(destination: string): Promise<void> {
    if (!this.userAgent) {
      throw new Error("Not connected - please register first");
    }

    // Get the domain from the UserAgent configuration
    const domain = this.userAgent.configuration.uri.host;
    
    // Build the target URI
    // If destination includes @, use as-is; otherwise add the domain
    const targetUri = destination.includes("@")
      ? `sip:${destination}`
      : `sip:${destination}@${domain}`;

    const target = UserAgent.makeURI(targetUri);
    
    if (!target) {
      throw new Error("Invalid destination number");
    }

    // Create an Inviter to make the call
    const inviter = new Inviter(this.userAgent, target, {
      sessionDescriptionHandlerOptions: {
        constraints: {
          // We want audio, not video
          audio: true,
          video: false,
        },
      },
    });

    // Track this as our current session
    this.currentSession = inviter;
    this.callbacks?.onStateChange("calling");
    this.callbacks?.onCallerId(destination);

    // Set up session event handlers
    this.setupSessionHandlers(inviter);

    try {
      // Send the INVITE (start the call)
      await inviter.invite();
    } catch (error) {
      this.currentSession = null;
      this.callbacks?.onStateChange("registered");
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answer(): Promise<void> {
    if (!this.currentSession || !(this.currentSession instanceof Invitation)) {
      throw new Error("No incoming call to answer");
    }

    try {
      await (this.currentSession as Invitation).accept({
        sessionDescriptionHandlerOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
      });
    } catch (error) {
      this.callbacks?.onError("Failed to answer call");
      throw error;
    }
  }

  /**
   * Hang up the current call
   */
  async hangup(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    try {
      const state = this.currentSession.state;
      
      if (state === SessionState.Establishing || state === SessionState.Established) {
        // For established calls, send a BYE
        await this.currentSession.bye();
      } else if (this.currentSession instanceof Invitation) {
        // For incoming calls we haven't answered, reject them
        await (this.currentSession as Invitation).reject();
      } else if (this.currentSession instanceof Inviter) {
        // For outgoing calls that haven't connected, cancel them
        await (this.currentSession as Inviter).cancel();
      }
    } catch (error) {
      // Ignore hangup errors - the call might already be ended
      console.log("Hangup error (usually safe to ignore):", error);
    } finally {
      this.currentSession = null;
      this.isMuted = false;
      this.callbacks?.onStateChange("registered");
      this.callbacks?.onCallerId("");
    }
  }

  /**
   * Toggle mute on/off
   * Returns the new mute state
   */
  toggleMute(): boolean {
    if (!this.currentSession) {
      return false;
    }

    this.isMuted = !this.isMuted;

    // Get the session description handler (manages the audio/video streams)
    const sessionDescriptionHandler = this.currentSession.sessionDescriptionHandler;
    
    if (sessionDescriptionHandler) {
      // Access the peer connection to mute/unmute
      const peerConnection = (sessionDescriptionHandler as any).peerConnection as RTCPeerConnection;
      
      if (peerConnection) {
        // Get all audio senders and enable/disable them
        peerConnection.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === "audio") {
            sender.track.enabled = !this.isMuted;
          }
        });
      }
    }

    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  getMuteState(): boolean {
    return this.isMuted;
  }

  /**
   * Send a DTMF tone (for IVR menus, etc.)
   * DTMF = Dual-Tone Multi-Frequency (the beeps when you press phone keys)
   */
  sendDTMF(digit: string): void {
    if (!this.currentSession) {
      return;
    }

    // Validate the digit
    if (!/^[0-9*#]$/.test(digit)) {
      console.warn("Invalid DTMF digit:", digit);
      return;
    }

    try {
      // Send the tone info via SIP INFO message
      const options = {
        requestOptions: {
          body: {
            contentDisposition: "render",
            contentType: "application/dtmf-relay",
            content: `Signal=${digit}\r\nDuration=100`,
          },
        },
      };
      
      this.currentSession.info(options);
    } catch (error) {
      console.error("Failed to send DTMF:", error);
    }
  }

  /**
   * Handle an incoming call
   * Called by SIP.js when someone calls us
   */
  private handleIncomingCall(invitation: Invitation): void {
    // Store the session
    this.currentSession = invitation;
    
    // Extract caller ID from the invitation
    const fromHeader = invitation.request.from;
    const callerId = fromHeader?.uri?.user || "Unknown";
    
    // Notify UI
    this.callbacks?.onStateChange("ringing");
    this.callbacks?.onCallerId(callerId);

    // Set up handlers for this session
    this.setupSessionHandlers(invitation);
  }

  /**
   * Set up event handlers for a call session
   * Handles state changes like when the call connects or ends
   */
  private setupSessionHandlers(session: Session): void {
    // Listen for session state changes
    session.stateChange.addListener((state: SessionState) => {
      switch (state) {
        case SessionState.Establishing:
          // Call is being set up
          if (session instanceof Inviter) {
            this.callbacks?.onStateChange("calling");
          }
          break;
          
        case SessionState.Established:
          // Call is connected!
          this.callbacks?.onStateChange("in-call");
          this.setupRemoteAudio(session);
          break;
          
        case SessionState.Terminated:
          // Call has ended
          this.currentSession = null;
          this.isMuted = false;
          this.callbacks?.onStateChange("registered");
          this.callbacks?.onCallerId("");
          break;
      }
    });
  }

  /**
   * Set up remote audio playback
   * This connects the incoming audio stream to our audio element
   */
  private setupRemoteAudio(session: Session): void {
    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    
    if (!sessionDescriptionHandler || !this.remoteAudio) {
      return;
    }

    const peerConnection = (sessionDescriptionHandler as any).peerConnection as RTCPeerConnection;
    
    if (!peerConnection) {
      return;
    }

    // Get the remote audio stream and play it
    const remoteStream = new MediaStream();
    
    peerConnection.getReceivers().forEach((receiver) => {
      if (receiver.track && receiver.track.kind === "audio") {
        remoteStream.addTrack(receiver.track);
      }
    });

    this.remoteAudio.srcObject = remoteStream;
    this.remoteAudio.play().catch((error) => {
      console.error("Failed to play remote audio:", error);
    });
  }

  /**
   * Check if currently in a call
   */
  isInCall(): boolean {
    return this.currentSession !== null;
  }
}

// Export a singleton instance
// This ensures there's only one SIP service for the whole app
export const sipService = new SipService();
