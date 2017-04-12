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
// Module constants
//------------------------------------------------------------------------------

const SEVERITIES = [
    'ALL',
    'TRACE',
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
    'CRITICAL',
    'OFF'
]

const LEVEL_ALL = 0
const LEVEL_TRACE = 1
const LEVEL_DEBUG = 2
const LEVEL_INFO = 3
const LEVEL_WARN = 4
const LEVEL_ERROR = 5
const LEVEL_CRITICAL = 6
const LEVEL_OFF = 7

const DEFAULT_LEVEL = getDefaultLevel()

//------------------------------------------------------------------------------
// Private functions
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

function getDefaultLevel() {
    let value = process.env.LOG_LEVEL
    if (value) return parse(value, 'LOG_LEVEL environment variable')
    return LEVEL_INFO
}

//------------------------------------------------------------------------------
// Public functions
//------------------------------------------------------------------------------

function severity(level) {
    return SEVERITIES[level]
}

function parse(value, source) {
    let retval = null
    if (typeof value === 'number') {
        if (isValidLevel(value)) {
            retval = value
        }
    } else if (typeof value === 'string') {
        let level = parseFloat(value)
        if (isNaN(level)) {
            let index = SEVERITIES.indexOf(value.toUpperCase())
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
        throw new Error(`Invalid ${source}: ${value}`)
    }
    return retval
}

//------------------------------------------------------------------------------
// Module exports
//------------------------------------------------------------------------------

module.exports = {
    ALL: LEVEL_ALL,
    TRACE: LEVEL_TRACE,
    DEBUG: LEVEL_DEBUG,
    INFO: LEVEL_INFO,
    WARN: LEVEL_WARN,
    ERROR: LEVEL_ERROR,
    CRITICAL: LEVEL_CRITICAL,
    OFF: LEVEL_OFF,
    DEFAULT: DEFAULT_LEVEL,
    severity: severity,
    parse: parse
}