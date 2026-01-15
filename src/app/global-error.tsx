'use client';

import posthog from 'posthog-js';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        posthog.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                {/* NextError is the default Next.js error page component */}
                {/* We use statusCode 0 to indicate a client-side error */}
                <NextError statusCode={0} title="Global Application Error" />
            </body>
        </html>
    );
}
