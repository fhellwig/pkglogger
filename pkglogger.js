/*
 * Copyright (c) 2014 Frank Hellwig
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

var os = require('os'),
    fs = require('fs'),
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
    currentLevel = LEVEL_DEBUG;

function isInteger(n) {
    return n === +n && n === (n | 0);
}

function isInRange(n, min, max) {
    return n >= min && n <= max;
}

function isValidLogLevel(n) {
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

function formatLogMessage(args) {
    var message;
    var arg = args[0];
    if (typeof arg === 'string') {
        message = strformat.apply(null, args);
    } else {
        message = '' + arg;
    }
    return message.replace(/\r?\n/g, os.EOL + '> ') + os.EOL;
};

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

function writeLogMessage(level, args) {
    if (level >= currentLevel) {
        ensureLogDirectory();
//        args = Array.prototype.slice.call(args);
        var message = formatLogMessage(args),
            now = new Date(),
            ts = now.toISOString(),
            dt = ts.substring(0, ts.indexOf('T')),
            level = logLevels[level],
            filename = strformat('{0}.{1}.log', pkgfinder.name, dt),
            entry = strformat('{0} {1} [{2}]: {3}', ts, level, process.pid, message);
        fs.appendFileSync(path.resolve(logDirectory, filename), entry);
    }
}

module.exports = {
    ALL: LEVEL_ALL,
    TRACE: LEVEL_TRACE,
    DEBUG: LEVEL_DEBUG,
    INFO: LEVEL_INFO,
    WARN: LEVEL_WARN,
    ERROR: LEVEL_ERROR,
    FATAL: LEVEL_FATAL,
    OFF: LEVEL_OFF,
    getLevel: function () { return currentLevel; },
    setLevel: function (value) { currentLevel = parseLogLevel(value); },
    toString: function () { return logLevels[currentLevel]; },
    trace: function () { writeLogMessage(LEVEL_TRACE, arguments); },
    debug: function () { writeLogMessage(LEVEL_DEBUG, arguments); },
    info: function () { writeLogMessage(LEVEL_INFO, arguments); },
    warn: function () { writeLogMessage(LEVEL_WARN, arguments); },
    error: function () { writeLogMessage(LEVEL_ERROR, arguments); },
    fatal: function () { writeLogMessage(LEVEL_FATAL, arguments); }
};
