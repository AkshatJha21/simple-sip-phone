/**
 * Index Page
 * 
 * The main page of the SIP Softphone application.
 * Contains the softphone component centered on the page.
 */

import { Softphone } from "@/components/Softphone";
import { Phone } from "lucide-react";

const Index = () => {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            SIP Softphone
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          WebRTC-based SIP phone for browser calls
        </p>
      </header>

      {/* Softphone Component */}
      <Softphone />

      {/* Footer with instructions */}
      <footer className="mt-8 text-center text-xs text-muted-foreground max-w-md">
        <p className="mb-2">
          <strong>Quick Start:</strong> Enter your SIP credentials in the settings panel above,
          click Connect, then dial a number to make a call.
        </p>
        <p>
          Works with Asterisk, FreeSWITCH, or any WebRTC-enabled SIP provider.
        </p>
      </footer>
    </main>
  );
};

export default Index;
