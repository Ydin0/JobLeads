type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  prefix?: string;
  enableTimestamp?: boolean;
  minLevel?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Environment-based configuration
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const LOG_LEVEL_ENV = process.env.LOG_LEVEL as LogLevel | undefined;

// Default minimum log level based on environment
// Production: info (hide debug), Development: debug (show all)
// Can be overridden with LOG_LEVEL env variable
const DEFAULT_MIN_LEVEL: LogLevel = LOG_LEVEL_ENV || (IS_PRODUCTION ? "info" : "debug");

class Logger {
  private prefix: string;
  private enableTimestamp: boolean;
  private minLevel: LogLevel;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || "";
    this.enableTimestamp = options.enableTimestamp ?? true;
    this.minLevel = options.minLevel || DEFAULT_MIN_LEVEL;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level.toUpperCase()}]`);

    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    parts.push(message);

    return parts.join(" ");
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message), ...args);
    }
  }

  // Log object as formatted JSON
  json(label: string, obj: unknown, level: LogLevel = "debug"): void {
    if (this.shouldLog(level)) {
      const formatted = JSON.stringify(obj, null, 2);
      this[level](`${label}:\n${formatted}`);
    }
  }

  // Create a child logger with a new prefix
  child(prefix: string): Logger {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({
      prefix: childPrefix,
      enableTimestamp: this.enableTimestamp,
      minLevel: this.minLevel,
    });
  }
}

// Pre-configured loggers for different modules
export const logger = new Logger();
export const apifyLogger = new Logger({ prefix: "Apify" });
export const apolloLogger = new Logger({ prefix: "Apollo" });
export const dbLogger = new Logger({ prefix: "DB" });
export const authLogger = new Logger({ prefix: "Auth" });
export const apiLogger = new Logger({ prefix: "API" });

// Factory function to create custom loggers
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

export default logger;
