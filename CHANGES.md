pkglogger changes
=================

2.2.4
-----

- Added the `dir` method.

2.2.3
-----

- Fixed the index declaration in the `parseLevel` function.

2.2.2
-----

- Added 'use strict' to pkglogger.js.
- Added the LOG_DIR and LOG_FORMAT environment variables.
- Added the `format` getter and setter function.
- Removed automatically logging fatal errors to stderr.
- Removed the unique format for stderr.

2.2.1
-----

- Added default `level` and `stderr` functions.

2.2.0
-----

- Updated the README file to reflect the changes in version 2.1.0.
- Added the `log.stderr` function.
- Updated the format by separating the package name from the module file.
- Changed the `setLevel` and `getLevel` functions to a single `level` function.

2.1.0
-----

- Switched to using the `logs` directory for logging.

2.0.1
-----

- Fixed the backslash for forward slash replacement for the module path.

2.0.0
-----

- Switched to using the `var/log` directory for logging.
