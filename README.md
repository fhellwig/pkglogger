# pkglogger

A simple logger that writes to date-stamped log files.

Version: 3.0.0

## Quick Start

Install the `pkglogger` module.

```no-highlight
npm install pkglogger --save
```

Require the `pkglogger` module

```javascript
var pkglogger = require('pkglogger');
```

Create a log object by calling `pkglogger.createLog(<topic>)`. The `topic` parameter is a string that identifies the created log object. You can also pass in your module as the `topic` parameter. If this case, the topic is the relative filename of the module.

```javascript
var log = pkglogger.createLog('network');
```

Call the methods on the log object.

```no-highlight
log.trace('This is a trace message.');
log.debug('This is a debug message.');
log.info('This is an info message.');
log.warn('This is a warn message.');
log.error('This is an error message.');
log.fatal('This is a fatal message.');
```

The log file in the `logs` directory of your application (the directory containing your `package.json` file) will contain these messages:

```no-highlight
2016-03-05T12:02:27.151Z INFO pkglogger[4624] network: This is an info message.
2016-03-05T12:02:27.170Z WARN pkglogger[4624] network: This is a warn message.
2016-03-05T12:02:27.173Z ERROR pkglogger[4624] network: This is an error message.
2016-03-05T12:02:27.173Z FATAL pkglogger[4624] network: This is a fatal message.
```

The trace and debug messages are not logged because the default log level is set to INFO.

## API

The `pkglogger` instance has getters and setters that override various default parameters.

### pkglogger.level [ = value ]

Gets (or sets) the default log level. The `value` can be a string (either upper or lower case) or a number (0 through 7). There are six log levels as well as the `'ALL'` and `'OFF'` levels. Their string names and numerical values are as follows:

```no-highlight
'ALL'   0
'TRACE' 1
'DEBUG' 2
'INFO'  3
'WARN'  4
'ERROR' 5
'FATAL' 6
'OFF'   7
```

You can override the default log level on a per-logger basis by setting the log level on an individual logger.

```javascript
const pkglogger = require('pkglogger')

const log = pkglogger.createLog('network') // log level is INFO
log.trace('This will NOT be logged')

pkglogger.level = 'TRACE'
log.trace('This will now be logged')

log.level = 'DEBUG' // overrides TRACE
log.trace('This will NOT be logged')
```

The `LOG_LEVEL` environment variable, if set, overrides the initial default `INFO` log level.

```no-highlight
# Default log level
export LOG_LEVEL=2
export LOG_LEVEL=DEBUG
```

These both set the initial default log level to DEBUG.

### pkglogger.format [ = value ]

Gets (or sets) the format for log messages. Each log event generates a log record consisting of the following properties:

```javascript
{
    timestamp: {string},
    level: {
        name: {string},
        value: {number}
    },
    package: {
        name: {string},
        version: {string}
    },
    pid: {number},
    topic: {string},
    message: {string}
}
```

The default format is `{timestamp} {level.name} {package.name}[{pid}] {topic}: {message}`.

### pkglogger.filename [ = value ]

Gets (or sets) the filename of the log. The default filename is the package name (the name of the package requiring `pkglogger`). The full name of each log file is `<filename>.<date>.log`. A new log file is created for each day at midnight UTC.

### pkglogger.directory [ = value ]

Gets (or sets) the log directory. The default log directory is the `logs` directory in the package directory (the package requiring `pkglogger`). The directory is created if it does not exist. When setting this value, the directory is resolved against the package requiring `pkglogger` unless the value is an absolute pathname.

### pkglogger.files [ = value ]

Gets (or sets) the maximum number of files that are maintained in the log directory. The default value is ten (10).

### pkglogger.subscribe(topic, callback)

Registers a callback function that is called whenever a log event on the specified topic is generated. The callback function is called as `callback(record)`. You can register for all topics by using a wildcard (`*`) as the topic parameter. The `subscribe` method returns a token that can be used to unsubscribe from the topic.

### pkglogger.unsubscribe(token)

Unregisters the callback by using the token returned by the `subscribe` method.

### log.trace(message)
### log.debug(message)
### log.info(message)
### log.warn(message)
### log.error(message)
### log.fatal(message)

Each of these methods takes a message string (or an object, such as an Error) as the first parameter. The message can contain optional placeholders that are replaced by the values of any additional arguments using the [strformat](https://github.com/fhellwig/strformat) utility.

- If the first argument is an object, then...
- If the object has a `message` property, then that message is logged.
- Otherwise, the object is converted to a string and that string becomes the error message.
- If the arguments following the `message` parameter are primitive values, then these values are accessed using numerical placeholders. For example, `{0}` is the first argument after the `message` parameter, `{1}` is the second argument after the `message` parameter, and so on.
- If the first argument following the `message` parameter is an array, then the numeric placeholders are array index values (e.g., `{0}`, `{1}`, etc.).
- If the first argument after the `message` argument is an object, then the placeholders are the object property names (e.g., `{code}`).

## Notes

The log level only controls what messages are written to the log file. Subscribers are notified of *all* log events, regardless of the current log level.

## License

(The MIT License)

Copyright (c) 2017 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
