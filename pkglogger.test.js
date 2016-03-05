var pkglogger = require('./pkglogger');

var log = pkglogger(module);

function logMessages() {
    log.trace('This is a trace message.');
    log.debug('This is a debug message.');
    log.info('This is an info message.');
    log.warn('This is a warn message.');
    log.error('This is an error message.');
    log.fatal('This is a fatal message.');
}

logMessages();
log.setLevel(log.TRACE);
logMessages();
log.setLevel(log.OFF);
log.useStderr(true);
logMessages();
log.setLevel(log.WARN);
logMessages();
