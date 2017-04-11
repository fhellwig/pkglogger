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

const strformat = require('strformat')
const LogLevel = require('./LogLevel')
const LogFormatter = require('./LogFormatter')
const LogRecord = require('./LogRecord')

class Log {
    constructor(provider, topic) {
        this._provider = provider
        this._topic = topic
        Object.seal(this)
    }

    get topic() {
        return this._topic
    }

    trace(...args) { this.log(LogLevel.TRACE, args) }
    debug(...args) { this.log(LogLevel.DEBUG, args) }
    info(...args) { this.log(LogLevel.INFO, args) }
    warn(...args) { this.log(LogLevel.WARN, args) }
    error(...args) { this.log(LogLevel.ERROR, args) }
    fatal(...args) { this.log(LogLevel.FATAL, args) }

    log(level, args) {
        let message = LogFormatter.formatMessage(args)
        let record = new LogRecord(level, this.topic, message)
        this._provider.publish(this._topic, record)
    }
}

module.exports = Log