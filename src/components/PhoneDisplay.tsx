/**
 * Phone Display Component
 * 
 * Shows the phone number being dialed with:
 * - Large, readable digits
 * - Backspace button to delete
 * - Clear visual feedback
 */

import React from "react";
import { Delete } from "lucide-react";

interface PhoneDisplayProps {
  // The current phone number string
  number: string;
  // Called when backspace is pressed
  onBackspace: () => void;
  // Whether the display is disabled
  disabled?: boolean;
}

export function PhoneDisplay({
  number,
  onBackspace,
  disabled = false,
}: PhoneDisplayProps) {
  return (
    <div className="flex items-center justify-between px-4 py-6 min-h-[80px]">
      {/* Phone number display */}
      <div className="flex-1 text-center">
        <span
          className={`font-display text-3xl tracking-wider ${
            number ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {/* Show placeholder if empty */}
          {number || "Enter number"}
        </span>
      </div>

      {/* Backspace button - only show if there's something to delete */}
      {number && !disabled && (
        <button
          onClick={onBackspace}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Delete last digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
