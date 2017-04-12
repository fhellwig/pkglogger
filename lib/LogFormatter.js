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

const os = require('os')
const strformat = require('strformat')

const DEFAULT_FORMAT = '{timestamp} {severity} {package}[{pid}] {topic}: {message}'

class LogFormatter {

    constructor() {
        this._format = DEFAULT_FORMAT
        Object.seal(this)
    }

    get format() { return this._format }

    set format(value) { this._format = value }

    formatRecord(record) {
        return strformat(this._format, record)
    }

    static formatMessage(args) {
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
}

module.exports = LogFormatter