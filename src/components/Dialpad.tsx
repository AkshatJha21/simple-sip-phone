/**
 * Dialpad Component
 * 
 * A classic phone dialpad with:
 * - Numbers 0-9
 * - * and # keys
 * - Letters under numbers (like a real phone)
 * 
 * Each button can either:
 * - Add a digit to the phone number (when not in a call)
 * - Send DTMF tones (when in a call)
 */

import React from "react";

// Define the dialpad layout
// Each key has a main digit and optional letters below it
const DIALPAD_KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

interface DialpadProps {
  // Called when a key is pressed
  onDigit: (digit: string) => void;
  // Whether the dialpad is disabled (e.g., during connecting)
  disabled?: boolean;
}

export function Dialpad({ onDigit, disabled = false }: DialpadProps) {
  return (
    // 3-column grid layout for the dialpad
    <div className="grid grid-cols-3 gap-4 p-4">
      {DIALPAD_KEYS.map((key) => (
        <button
          key={key.digit}
          // Using our custom dialpad-btn class from the design system
          className={`dialpad-btn ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && onDigit(key.digit)}
          disabled={disabled}
          // Accessibility: tell screen readers what key this is
          aria-label={`${key.digit}${key.letters ? `, ${key.letters}` : ""}`}
        >
          {/* Main digit - large and prominent */}
          <span className="text-2xl font-semibold text-foreground">
            {key.digit}
          </span>
          {/* Letters below - small and muted */}
          {key.letters && (
            <span className="text-[10px] tracking-widest text-muted-foreground mt-0.5">
              {key.letters}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
