var pkglogger = require('./pkglogger');

var log = pkglogger(module);

var msg = 1;

function logMessages() {
    log.trace('This is trace message {0}.', msg++);
    log.debug('This is debug message {0}.', msg++);
    log.info('This is info message {0}.', msg++);
    log.warn('This is warn message {0}.', msg++);
    log.error('This is error message {0}.', msg++);
    log.fatal('This is fatal message {0}.', msg++);
}
pkglogger.level(pkglogger.DEBUG).stderr(true);
logMessages();
log.level(log.TRACE);
logMessages();
log.level(log.OFF).stderr(true);
logMessages();
log.level(log.WARN);
logMessages();
