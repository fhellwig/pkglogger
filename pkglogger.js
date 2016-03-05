/*
 * Copyright (c) 2016 Frank Hellwig
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

//------------------------------------------------------------------------------
// Dependencies
//------------------------------------------------------------------------------

var os = require('os'),
    fs = require('fs'),
    path = require('path'),
    mkdirs = require('mkdirs'),
    strformat = require('strformat'),
    pkgfinder = require('pkgfinder');

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

var MAX_LOG_FILES = 5,
    LOG_LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'],
    LEVEL_ALL = 0,
    LEVEL_TRACE = 1,
    LEVEL_DEBUG = 2,
    LEVEL_INFO = 3,
    LEVEL_WARN = 4,
    LEVEL_ERROR = 5,
    LEVEL_FATAL = 6,
    LEVEL_OFF = 7,
    LOG_FORMAT = '{timestamp} {level} {name}[{pid}] {file}: {message}',
    LOG_FORMAT_STDERR = '{time} {level} {file}: {message}';

//------------------------------------------------------------------------------
// Initialization
//------------------------------------------------------------------------------

var app = pkgfinder();

var logDirectory = app.resolve('logs');

var env = {
    level: process.env.LOG_LEVEL,
    stderr: process.env.LOG_STDERR
};

var defaults = {
    level: env.level ? parseLevel(env.level, 'LOG_LEVEL') : LEVEL_INFO,
    stderr: isOn(env.stderr)
};

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

function pkglogger(module) {
    if (typeof module !== 'object') {
        throw new Error('The pkglogger function requires a module argument.');
    }
    if (typeof module.filename !== 'string') {
        throw new Error('The module object must have a filename string property.');
    }
    mkdirs(logDirectory);
    var pkg = pkgfinder(module),
        name = pkg.name,
        file = pkg.relative(module.filename).replace(/\\/g, '/'),
        level = process.env.LOG_LEVEL,
        level = level ? parseLevel(level, 'LOG_LEVEL') : LEVEL_INFO,
        stderr = isOn(process.env.LOG_STDERR);
    log = {};
    log.trace = makeLogFunction(log, LEVEL_TRACE, name, file);
    log.debug = makeLogFunction(log, LEVEL_DEBUG, name, file);
    log.info = makeLogFunction(log, LEVEL_INFO, name, file);
    log.warn = makeLogFunction(log, LEVEL_WARN, name, file);
    log.error = makeLogFunction(log, LEVEL_ERROR, name, file);
    log.fatal = makeLogFunction(log, LEVEL_FATAL, name, file);
    log.level = function(value) {
        if (arguments.length === 0) return (typeof log._level === 'undefined') ? defaults.level : log._level;
        log._level = parseLevel(value);
        return log;
    };
    log.stderr = function(flag) {
        if (arguments.length === 0) return (typeof log._stderr === 'undefined') ? defaults.stderr : log._stderr;
        log._stderr = !!flag;
        return log;
    };
    log.ALL = LEVEL_ALL;
    log.TRACE = LEVEL_TRACE;
    log.DEBUG = LEVEL_DEBUG;
    log.INFO = LEVEL_INFO;
    log.WARN = LEVEL_WARN;
    log.ERROR = LEVEL_ERROR;
    log.FATAL = LEVEL_FATAL;
    log.OFF = LEVEL_OFF;
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

pkglogger.level = function(value) {
    if (arguments.length === 0) return defaults.level;
    defaults.level = parseLevel(value);
    return pkglogger;
};

pkglogger.stderr = function(flag) {
    if (arguments.length === 0) return defaults.stderr;
    defaults.stderr = !!flag;
    return pkglogger;
};

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

function isInteger(n) {
    return n === +n && n === (n | 0);
}

function isInRange(n, min, max) {
    return n >= min && n <= max;
}

function isValidLevel(n) {
    return isInteger(n) && isInRange(n, LEVEL_ALL, LEVEL_OFF);
}

function parseLevel(value, source) {
    var retval = null;
    if (typeof value === 'number') {
        if (isValidLevel(value)) {
            retval = value;
        }
    } else if (typeof value === 'string') {
        var level = parseFloat(value);
        if (isNaN(level)) {
            index = LOG_LEVELS.indexOf(value.toUpperCase());
            if (index >= 0) {
                retval = index;
            }
        } else {
            if (isValidLevel(level)) {
                retval = level;
            }
        }
    } else {
        throw new Error(strformat("The log level must be a string or a number instead of {0}.", typeof value));
    }
    if (retval === null) {
        source = source || 'log level';
        throw new Error(strformat("The {0} {1} is not valid.", source, value));
    }
    return retval;
}

function isOn(value) {
    if (typeof value !== 'string') return false;
    switch (value.toLowerCase()) {
        case 'on':
        case 'yes':
        case 'true':
        case '1':
            return true;
        default:
            return false;
    }
}

function makeLogFunction(log, level, name, file) {
    return function() {
        if (level < log.level()) return false;
        var record = {
            timestamp: new Date().toISOString(),
            level: LOG_LEVELS[level],
            name: name,
            pid: process.pid,
            file: file,
            message: formatLogMessage(arguments)
        };
        var ts = record.timestamp,
            date = ts.substring(0, ts.indexOf('T')),
            filename = strformat('{0}.{1}.log', app.name, date),
            entry = strformat(LOG_FORMAT, record);
        fs.appendFileSync(path.resolve(logDirectory, filename), entry);
        rollLogFiles();
        if (level == LEVEL_FATAL || log.stderr()) {
            record.time = ts.substring(ts.indexOf('T') + 1);
            process.stderr.write(strformat(LOG_FORMAT_STDERR, record));
        }
        return true;
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

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = pkglogger;
