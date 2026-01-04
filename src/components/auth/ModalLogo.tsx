"use client";

// -----------------------------------------------------------------------------
// Modal Logo Component
// Reusable hybrid branding (Icon + Wordmark) for auth modals
// -----------------------------------------------------------------------------

import Image from "next/image";

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Displays the Asset Hatch hybrid logo (Icon + new text).
 * Designed for use in modal headers with centered alignment.
 */
export function ModalLogo() {
    return (
        <div className="flex flex-col items-center gap-3 mb-4">
            {/* Egg Icon */}
            <Image
                src="/logo-icon.svg"
                alt="Asset Hatch"
                width={64}
                height={64}
                className="drop-shadow-[0_0_20px_rgba(194,123,160,0.6)]"
                priority
            />
            {/* Wordmark Text */}
            {/* Dark Mode */}
            <Image
                src="/logo-text-recreated.svg"
                alt="Asset Hatch"
                width={140}
                height={28}
                className="hidden dark:block brightness-125 drop-shadow-[0_2px_10px_rgba(74,124,126,0.3)]"
                priority
            />
            {/* Light Mode */}
            <Image
                src="/logo-text-light.svg"
                alt="Asset Hatch"
                width={140}
                height={28}
                className="block dark:hidden drop-shadow-[0_2px_10px_rgba(74,124,126,0.2)]"
                priority
            />
        </div>
    );
}
