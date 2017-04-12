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

const assert = require('assert')

class PubSub {

    constructor() {
        this._subscribers = {}
        Object.seal(this)
    }

    publish(topic, data) {
        assert(typeof topic === 'string', 'topic must be a string')
        Object.keys(this._subscribers).forEach(token => {
            let subscriber = this._subscribers[token]
            if (subscriber.topic === '*' || subscriber.topic === topic) {
                subscriber.callback(data)
            }
        })
    }

    subscribe(topic, callback) {
        assert(typeof topic === 'string', 'topic must be a string')
        assert(typeof callback === 'function', 'callback must be a function')
        let token = this.createToken()
        this._subscribers[token] = { topic, callback }
        return token
    }

    unsubscribe(token) {
        assert(typeof token === 'string', 'token must be a string')
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

module.exports = PubSub