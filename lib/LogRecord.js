const pkg = require('pkgfinder')()
const LogLevel = require('./LogLevel')

class LogRecord {
    constructor(level, topic, message) {
        this.timestamp = new Date().toISOString()
        this.level = {
            name: LogLevel.name(level),
            value: level
        }
        this.package = {
            name: pkg.name,
            version: pkg.version
        }
        this.pid = process.pid
        this.topic = topic
        this.message = message
    }
}

module.exports = LogRecord