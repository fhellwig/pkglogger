#pkglogger

A simple logger that writes to a date-stamped log file in the application's `logs` subdirectory.

##Quick Start

Install the `pkglogger` module.

```no-highlight
npm install pkglogger --save
```

Create a log object by calling the function exported by the `pkglogger` module and passing in your current module.

```javascript
var pkglogger = require('pkglogger'),
    log = pkglogger(module);
```

Call the methods on the log object.

```javascript
log.trace('This is a trace message.');
log.debug('This is a debug message.');
log.info('This is an info message.');
log.warn('This is a warn message.');
log.error('This is an error message.');
log.fatal('This is a fatal message.');
```

The log file in the `logs` directory will contain these messages:

```no-highlight
2014-12-26T13:02:52.667Z INFO test[2924] log-test.js: This is an info message.
2014-12-26T13:02:52.667Z WARN test[2924] log-test.js: This is a warn message.
2014-12-26T13:02:52.667Z ERROR test[2924] log-test.js: This is an error message.
2014-12-26T13:02:52.667Z FATAL test[2924] log-test.js: This is a fatal message.
```

Notice that trace and debug messages are not loggged by default. This can be
changed by setting the log level using either the `log.setLevel()`
function or by setting the `LOG_LEVEL` environment variable.

```javascript
var pkglogger = require('pkglogger'),
    log = pkglogger(module);
log.setLevel(pkglogger.ALL);
```

Now, all six levels are logged.

```no-highlight
2014-12-26T13:02:52.664Z TRACE test[2924] log-test.js: This is a trace message.
2014-12-26T13:02:52.666Z DEBUG test[2924] log-test.js: This is a debug message.
2014-12-26T13:02:52.667Z INFO test[2924] log-test.js: This is an info message.
2014-12-26T13:02:52.667Z WARN test[2924] log-test.js: This is a warn message.
2014-12-26T13:02:52.667Z ERROR test[2924] log-test.js: This is an error message.
2014-12-26T13:02:52.667Z FATAL test[2924] log-test.js: This is a fatal message.
```

##Log Levels

There are six log levels as well as the ALL and OFF values.
Their numerical values are as follows:

```no-highlight
ALL   0
TRACE 1
DEBUG 2
INFO  3
WARN  4
ERROR 5
FATAL 6
OFF   7
```

You can set the log level by either calling the `log.setLevel()` method or by
setting the `LOG_LEVEL` environment variable. The following all set the log
level to DEBUG:

```javascript
log.setLevel(pkglogger.DEBUG);  // using the constant
log.setLevel(2);                // or the equivalent number
log.setLevel('DEBUG');          // using a string
log.setLevel('debug');          // case does not matter
```
```no-highlight
export LOG_LEVEL=2
export LOG_LEVEL=DEBUG
```

The default log level is INFO.

##Log Name

The log name is used in log entries so that the origin of the message can be
determined. The log name is set when creating a log object. The required way
of creating a log object is by passing the `module` value to the `pkglogger()`
function.

```javascript
var log = pkglogger(module);
```

The relative path from the package directory to the module filename is
determined and used in log messages.

##Log Methods

There are six log methods:

```javascript
log.trace(message [,args]);
log.debug(message [,args]);
log.info(message [,args]);
log.error(message [,args]);
log.warn(message [,args]);
log.fatal(message [,args]);
```

Each of these takes a message string (or an object, such as an Error) as the
first parameter. The message can contain optional placeholders that are
replaced by the values of any additional arguments using the
[strformat](https://github.com/fhellwig/strformat) utility.

- If the first argument is an object, then...
    - If the object has a `message` property, then that message is logged.
    - Otherwise, the object is converted to a string and that string becomes the error message.
- If the arguments following the `message` parameter are primitive values, then these values are accessed using numerical placeholders. For example, `{0}` is the first argument after the `message` parameter, `{1}` is the second argument after the `message` parameter, and so on.
- If the first argument following the `message` parameter is an array, then the numeric placeholders are array index values (e.g., `{0}`, `{1}`, etc.).
- If the first argument after the `message` argument is an object, then the placeholders are the object property names (e.g., `{code}`).

##Log File

The log file is created in the application's `logs` subdirectory. This is
determined using the [pkgfinder](https://github.com/fhellwig/pkgfinder)
utility. The log filename is the application's name followed by the ISO date
according to the current UTC time. For example:

```no-highlight
server.2014-12-26.log 
```

The format of each log entry is `{timestamp} {level} {package}[{pid}] {module}: {message}`.

The full path of the `logs` directory can be obtained from the `pkglogger.directory` property.
This is useful for informing the user that an error occurred and where to look for the log file.
For example:

```javascript
performAction(function (err) {
    if (err) {
        log.fatal(err);
	console.error("An error occurred. Please examine the latest log file in '" +
	    pkglogger.directory + "' for details.");
	process.exit(1);
    }
};
```

## License

(The MIT License)

Copyright (c) 2014 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
