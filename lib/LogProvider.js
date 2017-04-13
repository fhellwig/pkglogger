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

const Log = require('./Log')
const LogFormatter = require('./LogFormatter')
const LogLevel = require('./LogLevel')
const LogPublisher = require('./LogPublisher')
const LogRecord = require('./LogRecord')
const LogWriter = require('./LogWriter')

class LogProvider {

    constructor() {
        this._logs = {}
        this._level = LogLevel.DEFAULT
        this._formatter = new LogFormatter()
        this._writer = new LogWriter(this._formatter)
        this._publisher = new LogPublisher()
        this._publisher.subscribe('*', record => {
            this._writer.writeRecord(record)
        })
        Object.seal(this)
    }

    get level() { return this._level }
    set level(value) { this._level = LogLevel.parse(value) }

    get severity() { return LogLevel.severity(this.level) }

    get format() { return this._formatter.format }
    set format(value) { this._formatter.format = value }

    get filename() { return this._writer.filename }
    set filename(value) { this._writer.filename = value }

    get directory() { return this._writer.directory }
    set directory(value) { this._writer.directory = value }

    get files() { return this._writer.files }
    set files(value) { this._writer.files = value }

    get ALL() { return LogLevel.ALL }
    get TRACE() { return LogLevel.TRACE }
    get DEBUG() { return LogLevel.DEBUG }
    get INFO() { return LogLevel.INFO }
    get WARN() { return LogLevel.WARN }
    get ERROR() { return LogLevel.ERROR }
    get CRITICAL() { return LogLevel.CRITICAL }
    get OFF() { return LogLevel.OFF }

    publish(record) {
        this._publisher.publish(record, this.level)
    }

    subscribe(topic, level, callback) {
        if (typeof level === 'function') {
            callback = level
            level = null
        } else {
            level = LogLevel.parse(level)
        }
        return this._publisher.subscribe(topic, level, callback)
    }

    unsubscribe(token) {
        this._publisher.unsubscribe(token)
    }

    getLog(topic) {
        if (typeof topic !== 'string') {
            throw new TypeError('The topic must be a string.')
        }
        let log = this._logs[topic]
        if (!log) {
            log = new Log(topic, this.publish.bind(this))
            this._logs[topic] = log
        }
        return log
    }
}

module.exports = LogProvider