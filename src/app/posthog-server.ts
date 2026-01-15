import { PostHog } from 'posthog-node';

// =============================================================================
// POSTHOG SERVER CLIENT
// Singleton instance of the PostHog Node.js client for server-side analytics
// =============================================================================

let posthogInstance: PostHog | null = null;

export function getPostHogServer() {
  if (!posthogInstance) {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!posthogKey) {
      console.warn('PostHog key not found. Server-side analytics will not be tracked.');
      return {
        capture: () => { },
        captureException: () => { }, // PostHog node client returns void for captureException
        shutdown: () => Promise.resolve(),
      } as unknown as PostHog;
    }

    posthogInstance = new PostHog(posthogKey, {
      host: posthogHost,
      flushAt: 1, // Flush immediately
      flushInterval: 0, // Flush immediately
    });
  }
  return posthogInstance;
}
