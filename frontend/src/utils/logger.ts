/**
 * Logger Utility - Environment-based logging
 * Only logs in development mode
 * In production, errors should be sent to error tracking service
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warning messages (only in development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log error messages
   * In production, this should send to error tracking service (Sentry, LogRocket, etc.)
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(args[0]);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Log API responses (only in development)
   */
  api: (method: string, url: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[API ${method}]`, url, data);
    }
  },
};

export default logger;
