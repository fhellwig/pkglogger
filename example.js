import { createLog } from "./pkglogger.js";

// Try running this example with different environment variables.
// In particular, try setting LOG_TRACE=example to override the
// LOG_LEVEL environment variable.

const log = createLog(import.meta);
console.log("Log configuration:", log.config);
console.log("Latest log file:", log.latestLogFile);
log.error(new Error("This is an error."));
log.warn("This is a warning message.");
log.info("This is an info message.");
log.debug("This is a debug message.");
