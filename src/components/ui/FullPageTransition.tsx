"use client";

// -----------------------------------------------------------------------------
// Full Page Transition Component
// A high-quality, non-interactive loading animation (Phase 6+)
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FullPageTransitionProps {
  /** Whether the transition is currently active */
  isActive: boolean;
  /** Optional message to display */
  message?: string;
}

/**
 * FullPageTransition
 * 
 * Provides a seamless visual bridge between major app states.
 * Uses Aurora gradients and a pulsing Hatch icon.
 */
export function FullPageTransition({ isActive, message }: FullPageTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isActive);

  // Handle animation out
  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      // Disable scrolling when active
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = "auto";
      }, 500); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-all duration-500",
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
      )}
    >
      {/* Aurora Background with heavy blur */}
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-2xl" />
      
      {/* Animated Aurora Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: '6s' }} />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Pulsing Icon */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* Logo Frame */}
          <div className="relative w-full h-full glass-panel rounded-3xl flex items-center justify-center p-4 border-white/10 animate-in zoom-in duration-700">
            <Image
              src="/logo-icon.svg"
              alt="Hatch Studios"
              width={80}
              height={80}
              className="w-full h-full object-contain animate-pulse"
              priority
            />
          </div>
        </div>

        {/* Text Stack */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">
            Hatch Studios
          </h2>
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase">
            {message || "Generating Experience"}
          </p>
        </div>

        {/* Progress Bar (Infinite) */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-1/2 rounded-full animate-[loading_2s_infinite_ease-in-out]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
