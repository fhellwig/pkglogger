const pkglogger = require('./pkglogger');

const log = pkglogger(module);

log.error(new Error('This is an error.'));
log.warn('This is a warning message.');
log.info('This is an info message.');
log.debug('This is a debug message.');
log.trace('This is a trace message.');