# pkglogger

A zero-configuration logger that writes to date-stamped log files.

Version: 4.0.1

## Quick Start

Install the `pkglogger` module.

```no-highlight
npm install pkglogger --save
```

Require the `pkglogger` module. This returns a `pkglogger()` function.

```javascript
const pkglogger = require('pkglogger');
```

Use the `pkglogger()` function to create a log for your module.

```javascript
const log = pkglogger('server');

server
  .start(port)
  .then(() => {
    log.info(`Listening on port ${port}.`);
  })
  .catch((err) => {
    log.error(err);
  });
```

Instead of a string, you can also pass in your own `module` object and the topic is created from the basename of the module's `filename` property.

```javascript
const log = pkglogger(module);
```

If no argument is provided, then the name of the package requiring the `pkglogger` module is used.

## Available Log Methods

There are five log methods. The message part of the log output is created by calling `msg.toString()` so error objects can be passed to each method as well as strings.

```
log.error(msg); // logs the message with severity 0 (ERROR)
log.warn(msg);  // logs the message with severity 1 (WARN)
log.info(msg);  // logs the message with severity 2 (INFO)
log.debug(msg); // logs the message with severity 3 (DEBUG)
log.trace(msg); // logs the message with severity 4 (TRACE)
```

The format of each log message is fixed:

    <timestamp> [<severity>] <topic>: <message>

When writing to the console, the timestamp is omitted from the output.

## Configuration

This logger is designed to work without any additional configuration. The configuration of a log can be obtained from the `config` property.

```javascript
console.dir(log.config);

{
  logTopic: {string},
  logDir: {string},
  logFile: {string},
  logFiles: {number},
  logLevel: {number},
  logTrace: [{string}],
  logConsole: {boolean}
}
```

### Log Directory

Log files are written to the `logs` directory of the package requiring the `pkglogger` module. This can be overridden by setting the `LOG_DIR` environemnt variable. The directory is created if it does not exist.

### Log File

The name of the each log file is created from the name of the package requiring the `pkglogger` module to which is appended the current date and the `.log` extension. This can be overridden by setting the `LOG_FILE` environment variable.

### Number of Log Files

At most five log files are maintained. This can be overridden by setting the `LOG_FILES` environment variable to an integer value. Setting `LOG_FILES` to a negative value disables file logging.

### Default Log Level

The default log level is 2 (INFO) if the `NODE_ENV` environment variable is set to `'production'`. Otherwise, it is 3 (DEBUG). This can be overridden by setting the `LOG_LEVEL` environment variable to an integer value (0 - 4).

### Handling Trace Logs

Calls with a severity of 4 (TRACE) are logged if the `LOG_LEVEL` environment variable is 4 or greater. However, there are times when you only want to trace events in specific modules. Setting the `LOG_TRACE` environment variable to a space-delimeted list of topics will result in a calls to `log.trace()` in those modules to be logged, *regardless* of the `LOG_LEVEL` setting.

### Console Output

Log messages are also written to the console if the `NODE_ENV` environment variable is _not_ set to `'production'`. This can be overridden by setting `LOG_CONSOLE=0`. Console output is styled using [chalk](https://www.npmjs.com/package/chalk). The color-coding of message can be disabled by setting `FORCE_COLOR=0`.

## License

(The MIT License)

Copyright (c) 2020 Frank Hellwig

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
