import { type Instrumentation } from 'next';

export function register() {
    // No-op for initialization
}

export const onRequestError: Instrumentation.onRequestError = async (
    err,
    request
) => {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { getPostHogServer } = await import('./app/posthog-server');
        const posthog = getPostHogServer();

        let distinctId: string | null = null;

        // Attempt to extract distinct_id from PostHog cookie
        // Attempt to extract distinct_id from PostHog cookie
        // Cast request to any to avoid strict type issues with Next.js internal request types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const req = request as any;
        const cookieHeader = req.headers?.get ? req.headers.get('cookie') : req.headers?.cookie;

        if (cookieHeader) {
            const postHogCookieMatch = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/);

            if (postHogCookieMatch && postHogCookieMatch[1]) {
                try {
                    const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
                    const postHogData = JSON.parse(decodedCookie);
                    distinctId = postHogData.distinct_id;
                } catch (e) {
                    console.error('Error parsing PostHog cookie:', e);
                }
            }
        }

        await posthog.captureException(err, distinctId || 'server_error_unknown_user');

        // Ensure events are flushed before the process might exit or the lambda freezes
        await posthog.shutdown();
    }
};
