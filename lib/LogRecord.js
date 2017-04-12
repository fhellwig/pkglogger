const pkg = require('pkgfinder')()
const LogLevel = require('./LogLevel')

class LogRecord {
    constructor(level, topic, message) {
        this.timestamp = new Date().toISOString()
        this.level = level
        this.severity = LogLevel.severity(level)
        this.package = pkg.name
        this.version = pkg.version
        this.pid = process.pid
        this.topic = topic
        this.message = message
    }
}

module.exports = LogRecord