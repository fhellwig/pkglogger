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
    pkg = pkgfinder(),
    logDirectory = pkg.resolve('logs'),
    logLevels = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF'],
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
        throw new Error ('The pkglogger function requires a module argument.');
    }
    if (typeof module.filename !== 'string') {
        throw new Error ('The module object must have a filename string property.');
    }
    var pkg = pkgfinder(module),
        mod = pkg.relative(module.filename).replace('\\', '/'),
        env = process.env.LOG_LEVEL,
        log = { _level: env ? parseLevel(env) : LEVEL_INFO },
        fun = makeLogFunction(log, pkg.name, mod);
    log.trace = function () { fun(LEVEL_TRACE, arguments); };
    log.debug = function () { fun(LEVEL_DEBUG, arguments); };
    log.info =  function () { fun(LEVEL_INFO,  arguments); };
    log.warn =  function () { fun(LEVEL_WARN,  arguments); };
    log.error = function () { fun(LEVEL_ERROR, arguments); };
    log.fatal = function () { fun(LEVEL_FATAL, arguments); };
    log.setLevel = function (level) { log._level = parseLevel(level); };
    log.getLevel = function () { return logLevels[log._level]; };
    return log;
}

pkglogger.ALL   = LEVEL_ALL;
pkglogger.TRACE = LEVEL_TRACE;
pkglogger.DEBUG = LEVEL_DEBUG;
pkglogger.INFO  = LEVEL_INFO;
pkglogger.WARN  = LEVEL_WARN;
pkglogger.ERROR = LEVEL_ERROR;
pkglogger.FATAL = LEVEL_FATAL;
pkglogger.OFF   = LEVEL_OFF;
pkglogger.directory = logDirectory;

function isInteger(n) {
    return n === +n && n === (n | 0);
}

function isInRange(n, min, max) {
    return n >= min && n <= max;
}

function isValidLevel(n) {
    return isInteger(n) && isInRange(n, LEVEL_ALL, LEVEL_OFF);
}

function parseLevel(level) {
    if (typeof level === 'number') {
        if (!isValidLevel(level)) {
            throw new Error('Not a valid log level: ' + level);
        }
        return level;
    }
    if (typeof level === 'string') {
        var tmp = parseFloat(level);
        if (!isNaN(tmp)) {
            return parseLevel(tmp);
        }
        tmp = logLevels.indexOf(level.toUpperCase());
        if (tmp < 0) {
            throw new Error('Not a valid log level: ' + level);
        }
        return tmp;
    }
    throw new Error('Not a valid log level type: ' + typeof level);
}

function parseName(name) {
    if (typeof name === 'undefined') {
        return pkg.name;
    }
    if (typeof name === 'object' && typeof name.filename === 'string') {
        return pkg.relative(name.filename);
    }
    if (typeof name === 'string') {
        return name;
    }
    throw new Error('Not a valid logger name type: ' + typeof name);
}

function formatMessage(args) {
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

function makeLogFunction(log, pkgname, modname) {
    return function (level, args) {
        if (level >= log._level) {
            ensureLogDirectory();
            var pid = process.pid,
                msg = formatMessage(args),
                now = new Date(),
                ts = now.toISOString(),
                dt = ts.substring(0, ts.indexOf('T')),
                level = logLevels[level],
                filename = strformat('{0}.{1}.log', pkg.name, dt),
                entry = strformat('{0} {1} {2}[{3}] {4}: {5}', ts, level, pkgname, pid, modname, msg);
            fs.appendFileSync(path.resolve(logDirectory, filename), entry);
        }
    }
}

module.exports = pkglogger;
