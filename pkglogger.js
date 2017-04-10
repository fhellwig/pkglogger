/*
 * Copyright (c) 2017 Frank Hellwig
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

'use strict'

//------------------------------------------------------------------------------
// Dependencies
//------------------------------------------------------------------------------

const os = require('os')
const fs = require('fs')
const path = require('path')
const mkdirs = require('mkdirs')
const strformat = require('strformat')
const pkgfinder = require('pkgfinder')

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

const MAX_LOG_FILES = 10
const LOG_LEVELS = ['ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF']
const LEVEL_ALL = 0
const LEVEL_TRACE = 1
const LEVEL_DEBUG = 2
const LEVEL_INFO = 3
const LEVEL_WARN = 4
const LEVEL_ERROR = 5
const LEVEL_FATAL = 6
const LEVEL_OFF = 7
const LOG_FORMAT = '{timestamp} {level} {name}[{pid}] {file}: {message}'

//------------------------------------------------------------------------------
// Initialization
//------------------------------------------------------------------------------

let app = pkgfinder()

let env = {
    dir: process.env.LOG_DIR,
    level: process.env.LOG_LEVEL,
    format: process.env.LOG_FORMAT,
    stderr: process.env.LOG_STDERR
}

let defaults = {
    dir: app.resolve(env.dir ? env.dir : 'logs'),
    level: env.level ? parseLevel(env.level, 'LOG_LEVEL') : LEVEL_INFO,
    format: env.format ? env.format : LOG_FORMAT,
    stderr: isOn(env.stderr),
    files: MAX_LOG_FILES
}

//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

function pkglogger(parent) {
    parent = parent || module.parent
    if (typeof parent !== 'object') {
        throw new Error('The pkglogger function requires a parent argument.')
    }
    if (typeof parent.filename !== 'string') {
        throw new Error('The parent must have a filename string property.')
    }
    let pkg = pkgfinder(parent)
    let name = pkg.name
    let file = pkg.relative(parent.filename).replace(/\\/g, '/')
    let log = {}
    log.trace = makeLogFunction(log, LEVEL_TRACE, name, file)
    log.debug = makeLogFunction(log, LEVEL_DEBUG, name, file)
    log.info = makeLogFunction(log, LEVEL_INFO, name, file)
    log.warn = makeLogFunction(log, LEVEL_WARN, name, file)
    log.error = makeLogFunction(log, LEVEL_ERROR, name, file)
    log.fatal = makeLogFunction(log, LEVEL_FATAL, name, file)
    log.level = function (value) {
        if (arguments.length === 0) {
            return (typeof log._level === 'undefined') ? defaults.level : log._level
        }
        log._level = parseLevel(value)
        return log
    }
    log.format = function (spec) {
        if (arguments.length === 0) {
            return (typeof log._format === 'undefined') ? defaults.format : log._format
        }
        log._format = spec
        return log
    }
    log.stderr = function (flag) {
        if (arguments.length === 0) {
            return (typeof log._stderr === 'undefined') ? defaults.stderr : log._stderr
        }
        log._stderr = !!flag
        return log
    }
    log.ALL = LEVEL_ALL
    log.TRACE = LEVEL_TRACE
    log.DEBUG = LEVEL_DEBUG
    log.INFO = LEVEL_INFO
    log.WARN = LEVEL_WARN
    log.ERROR = LEVEL_ERROR
    log.FATAL = LEVEL_FATAL
    log.OFF = LEVEL_OFF
    return log
}

pkglogger.ALL = LEVEL_ALL
pkglogger.TRACE = LEVEL_TRACE
pkglogger.DEBUG = LEVEL_DEBUG
pkglogger.INFO = LEVEL_INFO
pkglogger.WARN = LEVEL_WARN
pkglogger.ERROR = LEVEL_ERROR
pkglogger.FATAL = LEVEL_FATAL
pkglogger.OFF = LEVEL_OFF

pkglogger.level = function (value) {
    if (arguments.length === 0) return defaults.level
    defaults.level = parseLevel(value)
    return pkglogger
}

pkglogger.format = function (spec) {
    if (arguments.length === 0) return defaults.format
    defaults.format = spec
    return pkglogger
}

pkglogger.stderr = function (flag) {
    if (arguments.length === 0) return defaults.stderr
    defaults.stderr = !!flag
    return pkglogger
}

pkglogger.dir = function (dirname) {
    if (arguments.length === 0) return defaults.dir
    defaults.dir = app.resolve(dirname)
    return pkglogger
}

pkglogger.files = function (days) {
    if (arguments.length === 0) return defaults.files
    let valid = isInteger(days) && isInRange(days, 1, 1000)
    if (!valid) {
        throw new Error('The days must be an integer in the range of 1..1000.')
    }
    defaults.files = days
    return pkglogger
}

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

function isInteger(n) {
    return n === +n && n === (n | 0)
}

function isInRange(n, min, max) {
    return n >= min && n <= max
}

function isValidLevel(n) {
    return isInteger(n) && isInRange(n, LEVEL_ALL, LEVEL_OFF)
}

function parseLevel(value, source) {
    let retval = null
    if (typeof value === 'number') {
        if (isValidLevel(value)) {
            retval = value
        }
    } else if (typeof value === 'string') {
        let level = parseFloat(value)
        if (isNaN(level)) {
            let index = LOG_LEVELS.indexOf(value.toUpperCase())
            if (index >= 0) {
                retval = index
            }
        } else {
            if (isValidLevel(level)) {
                retval = level
            }
        }
    } else {
        throw new Error(`The log level must be a string or a number instead of ${typeof value}.`)
    }
    if (retval === null) {
        source = source || 'log level'
        throw new Error(`The ${source} ${value} is not valid.`)
    }
    return retval
}

function isOn(value) {
    if (typeof value !== 'string') return false
    switch (value.toLowerCase()) {
        case 'on':
        case 'yes':
        case 'true':
        case '1':
            return true
        default:
            return false
    }
}

function makeLogFunction(log, level, name, file) {
    return function () {
        if (level < log.level()) {
            return false
        }
        let record = {
            timestamp: new Date().toISOString(),
            level: LOG_LEVELS[level],
            pid: process.pid,
            name: name,
            file: file,
            message: formatLogMessage(arguments)
        }
        let ts = record.timestamp
        let date = ts.substring(0, ts.indexOf('T'))
        let filename = `${app.name}.${date}.log`
        let entry = strformat(log.format(), record) + os.EOL
        let dir = defaults.dir
        mkdirs(dir)
        fs.appendFileSync(path.resolve(dir, filename), entry)
        rollLogFiles(dir)
        if (log.stderr()) {
            process.stderr.write(entry)
        }
        return true
    }
}

function formatLogMessage(args) {
    let msg
    let arg = args[0]
    if (typeof arg === 'string') {
        msg = strformat.apply(null, args)
    } else if (typeof arg === 'object' && typeof arg.message === 'string') {
        msg = arg.message
    } else {
        msg = '' + arg
    }
    return msg.replace(/\r?\n/g, os.EOL + '> ')
}

function formatLogRecord(format, record) {
    return strformat(log.format(), record) + os.EOL
}

function rollLogFiles(dir) {
    let files = fs.readdirSync(dir)
    if (files.length > defaults.files) {
        files.sort()
        for (let i = 0; i < files.length - defaults.files; i++) {
            fs.unlinkSync(path.resolve(dir, files[i]))
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = pkglogger
