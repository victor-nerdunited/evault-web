import pino from "pino";

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
  <T extends object>(obj: T, msg?: string, ...args: any[]): void;
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
    level: level ?? process.env.NODE_ENV === "development" ? "debug" : "warn",
  }) as unknown as Logger;
  return logger;
}