import * as Sentry from '@sentry/react';

let sentryInitialized = false;

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || sentryInitialized) return;

  Sentry.init({
    dsn,
    environment: (import.meta.env.MODE as string) || 'development',
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0),
  });

  sentryInitialized = true;
};

export const setSentryUser = (user: { _id?: string; email?: string; name?: string } | null) => {
  if (!sentryInitialized) return;

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user._id ? String(user._id) : undefined,
    email: user.email,
    username: user.name,
  });
};
