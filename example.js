const pkglogger = require('./pkglogger');

// Try running this example with different environment variables.
// In particular, try setting LOG_TRACE=example to override the
// LOG_LEVEL environment variable.

const log = pkglogger(module);
console.dir(log.config);
console.log('---------------------------------------------');
console.log(log.latestLogFile);
console.log('---------------------------------------------');
log.error(new Error('This is an error.'));
log.warn('This is a warning message.');
log.info('This is an info message.');
log.debug('This is a debug message.');
