/**
 * Context Lens - Logging Utility
 * Provides structured logging with levels and context.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Default log level: INFO in production, DEBUG in development
const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

export const logger = {
  debug: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(`[ContextLens:DEBUG] ${message}`, context);
    }
  },
  info: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      console.info(`[ContextLens:INFO] ${message}`, context);
    }
  },
  warn: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(`[ContextLens:WARN] ${message}`, context);
    }
  },
  error: (message, context = {}) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(`[ContextLens:ERROR] ${message}`, context);
    }
  },
};
