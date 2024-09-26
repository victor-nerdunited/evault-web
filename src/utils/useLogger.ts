import log from "loglevel";

if (process.env.NODE_ENV === "development") {
  log.setLevel("debug");
} else {
  log.setLevel("warn");
}

export const useLogger = (name: string, level?: "trace" | "debug" | "info" | "warn" | "error") => {
  const logger = log.getLogger(name);
  if (level) {
    logger.setLevel(level);
  }
  return logger;
}