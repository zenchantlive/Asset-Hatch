'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to PostHog
        posthog.captureException(error);
    }, [error]);

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-bold">Something went wrong!</h2>
            <p className="text-muted-foreground text-sm">
                We&apos;ve logged this error and will look into it.
            </p>
            <button
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Try again
            </button>
        </div>
    );
}
