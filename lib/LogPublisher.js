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

class LogPublisher {

    constructor() {
        this._subscribers = {}
        Object.seal(this)
    }

    publish(record, currentLevel) {
        Object.keys(this._subscribers).forEach(token => {
            let subscriber = this._subscribers[token]
            if (subscriber.topic !== '*' && subscriber.topic !== record.topic) return
            if (subscriber.level === null && record.level < currentLevel) return
            if (subscriber.level !== null && record.level < subscriber.level) return
            subscriber.callback(record)
        })
    }

    subscribe(topic, level, callback) {
        if (typeof level === 'function') {
            callback = level
            level = null
        }
        let token = this.createToken()
        this._subscribers[token] = { topic, level, callback }
        return token
    }

    unsubscribe(token) {
        delete this._subscribers[token]
    }

    createToken() {
        while (true) {
            let token = 'sub-' + Math.floor(Math.random() * 10000000)
            if (!this._subscribers[token]) {
                return token
            }
        }
    }
}

module.exports = LogPublisher