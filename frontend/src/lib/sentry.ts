/**
 * Sentry SDK initialisation.
 * Call once at the very start of main.tsx before rendering.
 * No-op if VITE_SENTRY_DSN is unset.
 */
import * as Sentry from "@sentry/react";

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: `typeshala@${import.meta.env.VITE_APP_VERSION ?? "1.0.0"}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Capture 10 % of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 5 % of sessions for session replay
    replaysSessionSampleRate: 0.05,
    // Capture 100 % of sessions where an error occurs
    replaysOnErrorSampleRate: 1.0,
  });
}

/** Re-export Sentry so callers can use Sentry.captureException etc. */
export { Sentry };
