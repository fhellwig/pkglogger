const fs = require('fs')
const path = require('path')
const assert = require('assert')
const pkglogger = require('../pkglogger')
const LogRecord = require('../lib/LogRecord')
const pkg = require('pkgfinder')()

pkglogger.directory = path.resolve(__dirname, 'logs')
const log = pkglogger.getLog('test')

const trace = new LogRecord(1, 'test', 'This is a test')
trace.package = pkg.name
trace.version = pkg.version

describe('pkglogger', function () {
    it('should publish a log record', function (done) {
        let token
        function callback(record) {
            trace.timestamp = record.timestamp
            assert.deepStrictEqual(record, trace, 'Expected a trace record')
            pkglogger.unsubscribe(token)
            done()
        }
        token = pkglogger.subscribe('test', callback)
        log.trace('This is a {0}', 'test')
    })
    after(function (done) {
        done()
    })
})