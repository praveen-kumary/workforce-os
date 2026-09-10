/**
 * Structured Logger for Unified Workforce OS
 * Supports log levels, request ID context, JSON output for production.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
};

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL,
};

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  module?: string;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;
  private module?: string;
  private requestId?: string;

  constructor(options: { level?: string; module?: string; requestId?: string } = {}) {
    this.level = LOG_LEVEL_MAP[options.level?.toLowerCase() ?? 'info'] ?? LogLevel.INFO;
    this.module = options.module;
    this.requestId = options.requestId;
  }

  child(context: { module?: string; requestId?: string }): Logger {
    const child = new Logger({
      level: LOG_LEVEL_NAMES[this.level].toLowerCase(),
      module: context.module ?? this.module,
      requestId: context.requestId ?? this.requestId,
    });
    return child;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LOG_LEVEL_NAMES[level],
      message,
      ...(this.module && { module: this.module }),
      ...(this.requestId && { requestId: this.requestId }),
      ...data,
    };

    if (data?.error instanceof Error) {
      entry.error = {
        message: data.error.message,
        stack: data.error.stack,
        code: (data.error as any).code,
      };
      delete entry.error; // Remove the raw error
      entry.error = {
        message: (data.error as Error).message,
        stack: (data.error as Error).stack,
        code: (data.error as any).code,
      };
    }

    const output = JSON.stringify(entry);

    if (level >= LogLevel.ERROR) {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, data);
  }
}

// Default application logger — level set from env
export const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  module: 'app',
});

export { Logger };
