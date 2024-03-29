# pkglogger changes

## 4.2.4

- Console output does not include timestamp or pid.

## 4.2.3

- Removed padding from severity.

## 4.2.2

- Fixed fs ESM bug (fs.unlinkSync).

## 4.2.1

- Updated mkdirs to version 1.0.0.

## 4.2.0

- Convert to ESM only.

## 4.1.6

- Convert to dual CommonJS/ES Module package.

## 4.1.5

- Handle import.meta in addition to module.

## 4.1.4

- Changed from pkgfinder to read-pkg-up since pkgfinder uses require.main and that breaks when using ES6 modules.

## 4.1.1

- Removed the TRACE log level as the same functionality can be achieved using the DEBUG level and the LOG_DEBUG or DEBUG envionment variables.
- Added the latestLogFile getter.

## 4.0.2

- README fix.

## 4.0.1

- The default log level for development is DEBUG instead of TRACE.
- Added handling of the LOG_TRACE environment variable.

## 4.0.0

- Rewrote this package as a zero-configuration logger.

## 3.0.5

- Fixed typos in README file.

## 3.0.4

- Fixed typos in README file.

## 3.0.3

- Allow an optional level for each subcriber.

## 3.0.2

- Added the ALL and OFF constants to LogProvider.

## 3.0.1

- Changed pubsub token to a non-integer string.
- Added tests.

## 3.0.0

- Developed a new pkglogger framework.

## 2.3.2

- Revert back to requiring a parent module argument.

## 2.3.1

- Remove from module cache if no parent module specified.

## 2.3.0

- Made the `dir` method a `pkglogger` level function only.
- Added the `files` method to the `pkglogger` object.
- Changed the default number of files from five to ten.

## 2.2.4

- Added the `dir` method.

## 2.2.3

- Fixed the index declaration in the `parseLevel` function.

## 2.2.2

- Added 'use strict' to pkglogger.js.
- Added the LOG_DIR and LOG_FORMAT environment variables.
- Added the `format` getter and setter function.
- Removed automatically logging fatal errors to stderr.
- Removed the unique format for stderr.

## 2.2.1

- Added default `level` and `stderr` functions.

## 2.2.0

- Updated the README file to reflect the changes in version 2.1.0.
- Added the `log.stderr` function.
- Updated the format by separating the package name from the module file.
- Changed the `setLevel` and `getLevel` functions to a single `level` function.

## 2.1.0

- Switched to using the `logs` directory for logging.

## 2.0.1

- Fixed the backslash for forward slash replacement for the module path.

## 2.0.0

- Switched to using the `var/log` directory for logging.
