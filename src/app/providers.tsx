'use client';

// =============================================================================
// POSTHOG PROVIDER
// Client-side analytics provider for PostHog integration
// Must be a client component due to posthog-js requiring browser APIs
// =============================================================================

import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

// =============================================================================
// POSTHOG PROVIDER COMPONENT
// Initializes PostHog on the client-side and provides context to children
// =============================================================================

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Only initialize if the PostHog key is available
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (!posthogKey) {
      console.warn('PostHog key not found. Analytics will not be tracked.');
      return;
    }

    // Initialize PostHog with configuration
    posthog.init(posthogKey, {
      // API host - defaults to US cloud if not specified
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Only create person profiles when user is explicitly identified (e.g., on login)
      // This is more privacy-friendly than 'always' which tracks anonymous users
      person_profiles: 'identified_only',
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture page leave events for better session tracking
      capture_pageleave: true,
      // Disable in development to avoid polluting production data
      loaded: (posthogInstance) => {
        // Enable debug mode in development for easier debugging
        if (process.env.NODE_ENV === 'development') {
          posthogInstance.debug();
        }
      },
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}
