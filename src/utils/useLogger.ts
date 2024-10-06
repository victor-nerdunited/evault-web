import pino from "pino";
import * as Sentry from "@sentry/nextjs"

/**
   * Possible log level descriptors, may be string, lower or upper case, or number.
   */
type LogLevelDesc = LogLevelNames | 'silent' | keyof LogLevel;
type LogLevelNames =
        | 'trace'
        | 'debug'
        | 'info'
        | 'warn'
        | 'error'
        | 'fatal';
interface LogLevel {
  TRACE: 0;
  DEBUG: 1;
  INFO: 2;
  WARN: 3;
  ERROR: 4;
  FATAL: 5;
  SILENT: 6;
}

interface LogFn {
  // TODO: why is this different from `obj: object` or `obj: any`?
  /* tslint:disable:no-unnecessary-generics */
  // <T extends object>(obj: T, msg?: string, ...args: any[]): void;
  (obj: unknown, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

export interface Logger {
  /**
   * Available log levels.
   */
  readonly levels: LogLevel;

  /**
         * Log at `'fatal'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
         * If more args follows `msg`, these will be used to format `msg` using `util.format`.
         *
         * @typeParam T: the interface of the object being serialized. Default is object.
         * @param obj: object to be serialized
         * @param msg: the log message to write
         * @param ...args: format string values when `msg` is a format string
         */
  fatal: LogFn;
  /**
   * Log at `'error'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  error: LogFn;
  /**
   * Log at `'warn'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  warn: LogFn;
  /**
   * Log at `'info'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  info: LogFn;
  /**
   * Log at `'debug'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  debug: LogFn;
  /**
   * Log at `'trace'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
   * If more args follows `msg`, these will be used to format `msg` using `util.format`.
   *
   * @typeParam T: the interface of the object being serialized. Default is object.
   * @param obj: object to be serialized
   * @param msg: the log message to write
   * @param ...args: format string values when `msg` is a format string
   */
  trace: LogFn;
  /**
   * Noop function.
   */
  silent: LogFn;
}

export const useLogger = (name: string, level?: "trace" | "debug" | "info" | "warn" | "error") => {
  const logger: Logger = pino({
    name,
    level: level ?? process.env.NODE_ENV === "development" ? "debug" : "info",
    // browser: {
    //   asObject: false,
    //   write: {
    //     error: function (msg, ...args) {
    //       Sentry.captureException(msg, ...args);
    //     },
    //     fatal: function(msg, ...args) {
    //       Sentry.captureException(msg, ...args);
    //     }
    //   }
    // }
    formatters: {
      level: (label) => {
        return {
          level: label
        }
      }
    },
  }) as unknown as Logger;

  const replaceLogFn = (logFn: any, isError: boolean, level: string) => {
    //const originalErrorLogger = logger.error.bind(logger);
    return (...args: any[]) => {
      if (Array.isArray(args)) {        
        if (isError) {
          const error = args[0] ?? undefined;
          const message = args.length > 1 ? args[1] : undefined;
          const otherArgs = args.length > 2 
            ? args.slice(2).reduce((p, c, i) => {
                p[i] = c;
                return p;
            }, {})
            : undefined;
          Sentry.captureException(error, {
            extra: {
              message,
              ...otherArgs
            }
          });
          logFn(error, message, otherArgs);
        } else {
          const message = args[0] ?? undefined;
          const extra = args.length > 1 ? args[1] : undefined;
          const otherArgs = args.length > 2 
            ? args.slice(2).reduce((p, c, i) => {
                p[i] = c;
                return p;
            }, {})
            : undefined;
          Sentry.captureMessage(message, {
            level,
            extra,
            ...otherArgs
          })
          logFn(extra, message, otherArgs);
        }
      } else {
        Sentry.captureException(args);
        logFn(args);
      }
    }
  }
  logger.error = replaceLogFn(logger.error.bind(logger), true, "error");
  logger.warn = replaceLogFn(logger.warn.bind(logger), true, "warn");
  logger.info = replaceLogFn(logger.info.bind(logger), false, "info");
  if (process.env.NODE_ENV !== "production") {
    logger.debug = replaceLogFn(logger.debug.bind(logger), false, "debug");
  }
  
  return logger;
}