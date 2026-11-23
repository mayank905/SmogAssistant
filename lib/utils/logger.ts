/**
 * Application Logger Utility
 * Provides structured logging without polluting stderr/stdout during automated testing
 * or production runs unless DEBUG or non-production environment is set.
 */

const isDev = process.env.NODE_ENV === "development" || process.env.DEBUG === "true";

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (isDev) {
      console.error(...args);
    }
  },
};
