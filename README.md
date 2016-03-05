#pkglogger

A simple logger that writes to date-stamped log files.

Version: 2.2.1

##Quick Start

Install the `pkglogger` module.

```no-highlight
npm install pkglogger --save
```

Require the `pkglogger` module

```javascript
var pkglogger = require('pkglogger');
```
Create a log object by calling the function exported by the `pkglogger` module and passing in your current module. Passing in your current module is required since the log file includes the relative path of the logging module.

```javascript
var log = pkglogger(module);
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
2016-03-05T12:02:27.151Z INFO pkglogger[4624] pkglogger.test.js: This is an info message.
2016-03-05T12:02:27.170Z WARN pkglogger[4624] pkglogger.test.js: This is a warn message.
2016-03-05T12:02:27.173Z ERROR pkglogger[4624] pkglogger.test.js: This is an error message.
2016-03-05T12:02:27.173Z FATAL pkglogger[4624] pkglogger.test.js: This is a fatal message.
```

Notice that trace and debug messages are not loggged by default. This can be changed by setting the log level using either the `log.level(value)` function, the default `pkglogger.level(value)` function, or by setting the `LOG_LEVEL` environment variable.

```javascript
log.level(log.ALL);
```

Now, all six levels are logged.

```no-highlight
2016-03-05T12:07:02.963Z TRACE pkglogger[4596] pkglogger.test.js: This is a trace message.
2016-03-05T12:07:02.963Z DEBUG pkglogger[4596] pkglogger.test.js: This is a debug message.
2016-03-05T12:07:02.963Z INFO pkglogger[4596] pkglogger.test.js: This is an info message.
2016-03-05T12:07:02.979Z WARN pkglogger[4596] pkglogger.test.js: This is a warn message.
2016-03-05T12:07:02.979Z ERROR pkglogger[4596] pkglogger.test.js: This is an error message.
2016-03-05T12:07:02.979Z FATAL pkglogger[4596] pkglogger.test.js: This is a fatal message.
```

##Log Levels

There are six log levels as well as the ALL and OFF values. Their numerical values are as follows:

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

You can set the default log level by either calling the `pkglogger.level(value)` function or by setting the `LOG_LEVEL` environment variable.

You can override the default log level by calling the `log.level(value)` function on each logger created by calling the `pkglogger(module)` function.

The following all set the log level to DEBUG:

```no-highlight
# Default log level
export LOG_LEVEL=2
export LOG_LEVEL=DEBUG
```


```javascript
// Default log level
pkglogger.level(pkglogger.DEBUG)
```

```javascript
// The level for a specific log instance
log.level(log.DEBUG);	// using the constant
log.level(2);          	// or the equivalent number
log.level('DEBUG');     // using a string
log.level('debug');		// case does not matter
```

The default log level is INFO.

Both the `pkglogger.level(value)` and `log.level(value)` functions are also a chainable as setters and, when called without any arguments, are getter functions.

##Log Name

The log name is used in log entries so that the origin of the message can be determined. The log name is set when creating a log object. The required way of creating a log object is by passing the `module` value to the `pkglogger()` function.

```javascript
var log = pkglogger(module);
```

The relative path from the package directory to the module filename is determined and used as the `file` placeholder in log messages.

##Log Methods

There are six log methods:

```no-highlight
log.trace(message [,args]);
log.debug(message [,args]);
log.info(message [,args]);
log.error(message [,args]);
log.warn(message [,args]);
log.fatal(message [,args]);
```

Each of these takes a message string (or an object, such as an Error) as the first parameter. The message can contain optional placeholders that are replaced by the values of any additional arguments using the [strformat](https://github.com/fhellwig/strformat) utility.

- If the first argument is an object, then...
- If the object has a `message` property, then that message is logged.
- Otherwise, the object is converted to a string and that string becomes the error message.
- If the arguments following the `message` parameter are primitive values, then these values are accessed using numerical placeholders. For example, `{0}` is the first argument after the `message` parameter, `{1}` is the second argument after the `message` parameter, and so on.
- If the first argument following the `message` parameter is an array, then the numeric placeholders are array index values (e.g., `{0}`, `{1}`, etc.).
- If the first argument after the `message` argument is an object, then the placeholders are the object property names (e.g., `{code}`).

##Log Files

The log file is created in the application's `logs` directory. The log filename is the application's name followed by the ISO date according to the current UTC time. For example:

    logs/server.2014-12-26.log 

At most five log files are maintained. Log files older than five days are automatically removed. The files in the `logs` subdirectory are read, sorted, and then all but the last five log files are removed.

The format of each log entry is

    {timestamp} {level} {name}[{pid}] {file}: {message}

where the `name` is the package name of the module specified in the call to the `pkglogger()` function and the `file` is the relative path of the module. 

##Logging to the Console

Log messages can also be written to `stderr` by setting the the stderr flag.

You can set the default value of the stderr flag by either calling the `pkglogger.stderr(flag)` function or by setting the `LOG_STDERR` environment variable. For the `LOG_STDERR` environment variable, a case-independent value of 'on', 'yes', 'true', or '1' will enable the stderr flag.

You can override the default stderr flag by calling the `log.stderr(flag)` function on each logger created by calling the `pkglogger(module)` function.

```javascript
// This enables the default stderr flag
pkglogger.stderr(true);

// This disables the stderr flag for a specific log instance
log.stderr(false);
```

The format for `stderr` log messages is a short form having the following format:

    {time} {level} {file}: {message}

The `time` is the time portion of the `timestamp` without the date.

Both the `pkglogger.stderr(flag)` and `log.stderr(flag)` functions are also a chainable as setters and, when called without any arguments, are getter functions.

###Fatal Log Entries

In addition to being written to the log file, fatal log entries are **always** copied to `stderr`, regardless of the setting of the `LOG_STDERR` environment variable.

```no-highlight
# Turn off copying log messages to stderr.
export LOG_STDERR=off
```

```javascript
// The following is still logged to stderr.
log.fatal('File system is full. Shutting down now.');
```

## License

(The MIT License)

Copyright (c) 2016 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
