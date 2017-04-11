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
const LogWriter = require('./LogWriter')
const PubSub = require('./PubSub')
const pkg = require('pkgfinder')()

class LogProvider {

    constructor() {
        this._level = LogLevel.DEFAULT
        this._formatter = new LogFormatter()
        this._writer = new LogWriter(this._formatter)
        this._pubsub = new PubSub()

        this._pubsub.subscribe('*', record => {
            if (record.level.value >= this.level) {
                this._writer.writeRecord(record)
            }
        })
    }

    get level() { return this._level }
    set level(value) { this._level = LogLevel.parse(value) }

    get format() { return this._formatter.format }
    set format(value) { this._formatter.format = value }

    get filename() { return this._writer.filename }
    set filename(value) { this._writer.filename = value }

    get directory() { return this._writer.directory }
    set directory(value) { this._writer.directory = value }

    get files() { return this._writer.files }
    set files(value) { this._writer.files = value }

    publish(topic, record) {
        this._pubsub.publish(topic, record)
    }

    subscribe(topic, callback) {
        return this._pubsub.subscribe(topic, callback)
    }

    unsubscribe(token) {
        this._pubsub.unsubscribe(token)
    }

    createLog(topic) {
        // If the topic is a string, then use it as is.
        if (typeof topic === 'string') {
            return new Log(this, topic)
        }
        // If the topic looks like a module, use the relative path.
        if (typeof topic === 'object' && typeof topic.filename === 'string') {
            topic = pkg.relative(topic.filename).replace(/\\/g, '/')
            return new Log(this, topic)
        }
        throw new Error(`Invalid topic: ${topic}`)
    }
}

module.exports = LogProvider