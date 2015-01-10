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
    mkdirs = require('mkdirs'),
    strformat = require('strformat'),
    pkgfinder = require('pkgfinder'),
    app = pkgfinder(),
    logDirectory = app.resolve('var', 'log'),
    MAX_LOG_FILES = 5,
    LOG_LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'],
    LEVEL_ALL = 0,
    LEVEL_TRACE = 1,
    LEVEL_DEBUG = 2,
    LEVEL_INFO = 3,
    LEVEL_WARN = 4,
    LEVEL_ERROR = 5,
    LEVEL_FATAL = 6,
    LEVEL_OFF = 7;

function pkglogger(module) {
    if (typeof module !== 'object') {
        throw new Error('The pkglogger function requires a module argument.');
    }
    if (typeof module.filename !== 'string') {
        throw new Error('The module object must have a filename string property.');
    }
    mkdirs(logDirectory);
    var pkg = pkgfinder(module),
        path = pkg.relative(module.filename).replace('\\', '/'),
        name = strformat('{0}/{1}', pkg.name, path),
        level = process.env.LOG_LEVEL,
        level = level ? parseLevel(level, 'LOG_LEVEL') : LEVEL_INFO,
        log = {
            _level: level
        };
    log.trace = makeLogFunction(log, LEVEL_TRACE, name);
    log.debug = makeLogFunction(log, LEVEL_DEBUG, name);
    log.info = makeLogFunction(log, LEVEL_INFO, name);
    log.warn = makeLogFunction(log, LEVEL_WARN, name);
    log.error = makeLogFunction(log, LEVEL_ERROR, name);
    log.fatal = makeLogFunction(log, LEVEL_FATAL, name);
    log.setLevel = function (level) {
        log._level = parseLevel(level);
    };
    log.getLevel = function () {
        return LOG_LEVELS[log._level];
    };
    return log;
}

pkglogger.ALL = LEVEL_ALL;
pkglogger.TRACE = LEVEL_TRACE;
pkglogger.DEBUG = LEVEL_DEBUG;
pkglogger.INFO = LEVEL_INFO;
pkglogger.WARN = LEVEL_WARN;
pkglogger.ERROR = LEVEL_ERROR;
pkglogger.FATAL = LEVEL_FATAL;
pkglogger.OFF = LEVEL_OFF;

function isInteger(n) {
    return n === +n && n === (n | 0);
}

function isInRange(n, min, max) {
    return n >= min && n <= max;
}

function isValidLevel(n) {
    return isInteger(n) && isInRange(n, LEVEL_ALL, LEVEL_OFF);
}

function parseLevel(level, source) {
    var retval = null;
    if (typeof level === 'number') {
        if (isValidLevel(level)) {
            retval = level;
        }
    } else if (typeof level === 'string') {
        var tmp = parseFloat(level);
        if (isNaN(tmp)) {
            index = LOG_LEVELS.indexOf(level.toUpperCase());
            if (index >= 0) {
                retval = index;
            }
        } else {
            if (isValidLevel(tmp)) {
                retval = tmp;
            }
        }
    } else {
        throw new Error(strformat("The log level must be a string or a number instead of {0}.", typeof level));
    }
    if (retval === null) {
        source = source || 'log level';
        throw new Error(strformat("The {0} {1} is not valid.", source, level));
    }
    return retval;
}

function isOn(value) {
    switch (value) {
        case 'on':
        case 'yes':
        case 'true':
        case '1':
            return true;
        default:
            return false;
    }
}

function makeLogFunction(log, level, name) {
    var pid = process.pid,
        severity = LOG_LEVELS[level];
    return function () {
        if (level >= log._level) {
            var msg = formatLogMessage(arguments),
                now = new Date(),
                ts = now.toISOString(),
                dt = ts.substring(0, ts.indexOf('T')),
                filename = strformat('{0}.{1}.log', app.name, dt),
                entry = strformat('{0} {1} [{2}] {3}: {4}', ts, severity, pid, name, msg);
            fs.appendFileSync(path.resolve(logDirectory, filename), entry);
            if (level == LEVEL_FATAL || isOn(process.env.LOG_STDERR)) {
                process.stderr.write(entry);
            }
            rollLogFiles();
        }
    }
}

function formatLogMessage(args) {
    var msg,
        arg = args[0];
    if (typeof arg === 'string') {
        msg = strformat.apply(null, args);
    } else if (typeof arg === 'object' && typeof arg.message === 'string') {
        msg = arg.message;
    } else {
        msg = '' + arg;
    }
    return msg.replace(/\r?\n/g, os.EOL + '> ') + os.EOL;
}

function rollLogFiles() {
    files = fs.readdirSync(logDirectory);
    if (files.length > MAX_LOG_FILES) {
        files.sort();
        for (var i = 0; i < files.length - MAX_LOG_FILES; i++) {
            fs.unlinkSync(path.resolve(logDirectory, files[i]));
        }
    }
}

module.exports = pkglogger;
