"use client";

// -----------------------------------------------------------------------------
// Transition Context
// Manages the global full-page loading state
// -----------------------------------------------------------------------------

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { FullPageTransition } from "@/components/ui/FullPageTransition";

interface TransitionContextType {
  /** Start the full-page transition */
  startTransition: (message?: string) => void;
  /** Stop the full-page transition */
  stopTransition: () => void;
  /** Current loading message */
  message: string;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

/**
 * Hook to use the transition context
 */
export function useAppTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useAppTransition must be used within a TransitionProvider");
  }
  return context;
}

/**
 * TransitionProvider
 * 
 * Wraps the app and provides the ability to show a full-page loading animation.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("Hatching your project...");

  const startTransition = useCallback((newMessage?: string) => {
    if (newMessage) setMessage(newMessage);
    setIsActive(true);
  }, []);

  const stopTransition = useCallback(() => {
    setIsActive(false);
  }, []);

  // Ensure transition stops if the user navigates or something fails
  // (Though usually we want the target page to call stopTransition)
  useEffect(() => {
    return () => {
      setIsActive(false);
    };
  }, []);

  return (
    <TransitionContext.Provider value={{ startTransition, stopTransition, message }}>
      {children}
      <FullPageTransition isActive={isActive} message={message} />
    </TransitionContext.Provider>
  );
}
