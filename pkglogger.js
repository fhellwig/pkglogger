var fs = require('fs'),
    path = require('path'),
    strformat = require('strformat'),
    pkgfinder = require('pkgfinder'),
    logDirectory = path.resolve(process.cwd(), './log'),
    logLevels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'],
    LEVEL_ALL = 0,
    LEVEL_TRACE = 1,
    LEVEL_DEBUG = 2,
    LEVEL_INFO = 3,
    LEVEL_WARN = 4,
    LEVEL_ERROR = 5,
    LEVEL_FATAL = 6,
    LEVEL_OFF = 7,
    currentLevel = LEVEL_DEBUG,
    envLevel = process.env.LOG_LEVEL;

function ensureLogDirectory() {
    if (fs.existsSync(logDirectory)) {
        var stats = fs.statSync(logDirectory);
        if (!stats.isDirectory()) {
            throw new Error("Not a directory: " + logDirectory);
        } 
    } else {
        fs.mkdirSync(logDirectory);
    }
}

function isInteger(n) {
    return n === +n && n === (n | 0);
}

function isInRange(n, min, max) {
    return n >= min && n <= max;
}

function isValidLogLevel(n) {
    console.log(n);
    return isInteger(n) && isInRange(n, LEVEL_ALL, LEVEL_OFF);
}

function parseLogLevel(value) {
    var level;
    if (typeof value === 'number') {
        if (!isValidLogLevel(value)) {
            throw new Error('Not a valid log level: ' + value);
        }
        return value;
    }
    if (typeof value === 'string') {
        var tmp = parseFloat(value);
        if (!isNaN(tmp)) {
            return parseLogLevel(tmp);
        }
        tmp = LEVELS.indexOf(value.toUpperCase());
        if (tmp < 0) {
            throw new Error('Not a valid log level: ' + value);
        }
        return tmp;
    }
    throw new Error('Not a valid log level type: ' + typeof value);
}

function writeLogMessage(level, message) {
    var now = new Date(),
        ts = now.toISOString(),
        dt = ts.substring(0, ts.indexOf('T')),
        filename = strformat('{0}.{1}.log', pkgfinder.name, dt),
        entry = strformat('{0} {1} [{2}]: {3}', ts, level, process.pid, message);
    fs.appendFileSync(path.resolve(logDirectory, filename), entry);
}

function getLogLevel() {
    return logLevels[currentLevel];
}

function setLogLevel(value) {
    currentLevel = parseLogLevel(value);
}

ensureLogDirectory();

if (envLevel) {
    setLogLevel(envLevel);
}

module.exports = {
    getLevel: getLogLevel,
    setLevel: setLogLevel,
    trace: null,
    debug: null,
    info: null,
    warn: null,
    error: null,
    fatal: null
};
