'use strict'

const os = require('os')
const fs = require('fs')
const path = require('path')
const assert = require('assert')
const pkglogger = require('../pkglogger')

const log = pkglogger.getLog('test')

pkglogger.directory = path.resolve(__dirname, 'logs')
pkglogger.filename = 'test'
pkglogger.format = '{timestamp}|{level}|{severity}|{package}|{version}|{pid}|{topic}|{message}'

describe('pkglogger', function () {
    it('should publish a log record', function (done) {
        function callback(record) {
            let time = record.timestamp.indexOf('T')
            let date = record.timestamp.substring(0, time)
            let name = `${pkglogger.filename}.${date}.log`
            let file = path.resolve(pkglogger.directory, name)
            fs.readFile(file, 'utf-8', (err, data) => {
                if (err) return done(err)
                let lines = data.split(os.EOL)
                let line = lines[lines.length - 2]
                let fields = line.split('|')
                let parsed = {
                    timestamp: fields[0],
                    level: fields[1],
                    severity: fields[2],
                    package: fields[3],
                    version: fields[4],
                    pid: fields[5],
                    topic: fields[6],
                    message: fields[7],
                }
                assert.deepEqual(record, parsed, 'Expected the records to match.')
                done()
            })
        }
        let token = pkglogger.subscribe('test', callback)
        log.info('This is a {0}', 'test')
        pkglogger.unsubscribe(token)
    })
    it('should respect the subscriber level', function (done) {
        let err = null
        function callback(record) {
            err = new Error('Should not have been called.')
        }
        let token = pkglogger.subscribe('test', pkglogger.WARN, callback)
        log.info('This is an info message.')
        pkglogger.unsubscribe(token)
        done(err)
    })
    it('should respect the default level', function (done) {
        let err = null
        function callback(record) {
            err = new Error('Should not have been called.')
        }
        let token = pkglogger.subscribe('test', callback)
        pkglogger.level = 'warn'
        log.info('This is an info message.')
        pkglogger.unsubscribe(token)
        done(err)
    })
    it('should remove old log files', function (done) {
        let now = 1
        let token = pkglogger.subscribe('test', record => {
            record.timestamp = new Date(now).toISOString()
            pkglogger._writer.writeRecord(record)
            now += 86401000
        })
        pkglogger.filename = 'rolling'
        pkglogger.files = 5
        pkglogger.level = 'info'
        for (let i = 0; i < 10; i++) {
            log.info('This is rolling log test {0}', now)
        }
        pkglogger.unsubscribe(token)
        fs.readdir(pkglogger.directory, (err, files) => {
            if (err) return done(err)
            const n = pkglogger.files
            assert(files.length === n + 1, `Expected ${n} rolling files and one test file.`)
            done()
        })
    })
    after(function (done) {
        fs.readdir(pkglogger.directory, (err, files) => {
            if (err) return done(err)
            for (const file of files) {
                fs.unlinkSync(path.resolve(pkglogger.directory, file))
            }
            fs.rmdirSync(pkglogger.directory)
            done()
        })
    })
})