"use client";

/**
 * ExpirationBanner Component
 * 
 * One-time education banner that warns users about unapproved 3D model URL expiration.
 * Shown once per user (tracked in localStorage).
 */

import { useState } from "react";
import { X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

// localStorage key for tracking if user has seen the banner
const STORAGE_KEY = "has_seen_3d_expiration_warning";

/**
 * Check if banner should be visible (runs only on client)
 * Using a function initializer avoids useEffect setState lint warning
 */
function getInitialVisibility(): boolean {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
}

/**
 * ExpirationBanner - Dismissable one-time education banner
 * 
 * Shows on first visit to 3D generation mode to inform users
 * that unapproved model download links expire after ~24 hours,
 * but approved models are permanent.
 */
export function ExpirationBanner() {
    // Track if banner should be shown - uses function initializer for SSR safety
    const [isVisible, setIsVisible] = useState(getInitialVisibility);

    // Handle dismiss - hide and save to localStorage
    const handleDismiss = () => {
        setIsVisible(false);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, "true");
        }
    };

    // Don't render if user has already dismissed
    if (!isVisible) return null;

    return (
        <div className="mx-2 mb-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            {/* Icon */}
            <Lightbulb className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />

            {/* Message */}
            <div className="flex-1 text-sm text-white/80">
                <span className="font-medium text-amber-400">Heads up!</span> 3D model download
                links expire after ~24 hours unless approved and saved to your project. Export
                or approve before they time out. Approved models are saved permanently and are
                safe to use any time.
            </div>

            {/* Dismiss button */}
            <Button
                variant="ghost"
                size="icon"
                aria-label="Dismiss warning"
                onClick={handleDismiss}
                className="h-6 w-6 flex-shrink-0 text-white/50 hover:text-white hover:bg-white/10"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
