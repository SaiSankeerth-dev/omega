// Structured logger for Omega
// Production-safe with log levels, timestamps, and structured output

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  if (typeof process !== 'undefined' && process.env?.LOG_LEVEL) {
    const level = process.env.LOG_LEVEL.toLowerCase() as LogLevel;
    if (level in LOG_LEVELS) return level;
  }
  return process.env?.NODE_ENV === 'production' ? 'info' : 'debug';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()];
}

function formatMessage(
  level: LogLevel,
  source: string,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}${metaStr}`;
}

export const logger = {
  debug(source: string, message: string, meta?: Record<string, unknown>): void {
    if (!shouldLog('debug')) return;
    if (process.env?.NODE_ENV === 'production') return; // No debug in production
    console.debug(formatMessage('debug', source, message, meta));
  },

  info(source: string, message: string, meta?: Record<string, unknown>): void {
    if (!shouldLog('info')) return;
    console.log(formatMessage('info', source, message, meta));
  },

  warn(source: string, message: string, meta?: Record<string, unknown>): void {
    if (!shouldLog('warn')) return;
    console.warn(formatMessage('warn', source, message, meta));
  },

  error(
    source: string,
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>,
  ): void {
    if (!shouldLog('error')) return;
    const errorMeta: Record<string, unknown> = { ...meta };
    if (error instanceof Error) {
      errorMeta.errorName = error.name;
      errorMeta.errorMessage = error.message;
      if (process.env?.NODE_ENV !== 'production') {
        errorMeta.stack = error.stack;
      }
    } else if (error !== undefined) {
      errorMeta.errorValue = error;
    }
    console.error(formatMessage('error', source, message, errorMeta));
  },
};

export type Logger = typeof logger;
