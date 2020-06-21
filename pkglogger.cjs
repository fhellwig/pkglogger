/*
 * Copyright (c) 2020 Frank Hellwig
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');
const chalk = require('chalk');
const mkdirs = require('mkdirs');
const readPkgUp = require('read-pkg-up');

const ERROR = 0;
const WARN = 1;
const INFO = 2;
const DEBUG = 3;

const DEFAULT_LEVEL = INFO;

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

const TRUE = ['1', 'true', 'yes', 'on'];
const FALSE = ['0', 'false', 'no', 'off'];

const pkg = readPkgUp.sync();
const env = process.env;
const isProduction = env.NODE_ENV === 'production';

const config = {
  logDir: env.LOG_DIR || path.join(path.dirname(pkg.path), 'logs'),
  logFile: env.LOG_FILE || pkg.packageJson.name,
  logFiles: parseInt(env.LOG_FILES) || 5,
  logLevel: getLogLevel(),
  logDebug: env.LOG_DEBUG || env.DEBUG,
  logConsole: getBoolean('LOG_CONSOLE', !isProduction),
};

const setDebugFlag = makeSetDebugFlagFunction();

function getLogLevel() {
  const env = process.env.LOG_LEVEL;
  // environment variable not set (undefined)
  if (typeof env !== 'string') {
    return DEFAULT_LEVEL;
  }
  const logLevel = env.trim().toUpperCase();
  if (logLevel.length === 0) {
    // logLevel is empty
    return DEFAULT_LEVEL;
  }
  let number = parseInt(logLevel);
  if (isNaN(number)) {
    // not a number - parse as string
    number = LEVELS.indexOf(logLevel);
    if (number < 0) {
      throw new RangeError(
        `Expected one of ERROR, WARN, INFO, or DEBUG for the LOG_LEVEL environment variable. Got '${logLevel}' instead.`
      );
    }
  } else {
    // check for valid number
    if (number < ERROR || number > DEBUG) {
      throw new RangeError(
        `Expected a number (0-3) for the LOG_LEVEL environment variable. Got ${number} instead.`
      );
    }
  }
  return number;
}

function getBoolean(name, defaultValue = false) {
  const env = process.env[name];
  if (typeof env !== 'string') {
    return defaultValue;
  }
  const str = env.trim().toLowerCase();
  if (str.length === 0) {
    return defaultValue;
  }
  if (TRUE.indexOf(str) !== -1) {
    return true;
  }
  if (FALSE.indexOf(str) !== -1) {
    return false;
  }
  const truthy = TRUE.join('|');
  const falsy = FALSE.join('|');
  throw new RangeError(
    `Expected (${truthy}) or (${falsy}) for the ${name} environment variable. Got '${env}' instead.`
  );
}

function makeSetDebugFlagFunction(debug) {
  if (config.logLevel === DEBUG) {
    return () => true;
  }
  if (typeof config.logDebug !== 'string') {
    return () => false;
  }
  const log = [];
  const not = [];
  config.logDebug
    .split(/[, ]+/)
    .filter((p) => !!p)
    .map((p) => p.replace(/\*/g, '.*'))
    .forEach((p) => {
      if (p.startsWith('-')) {
        not.push(p.slice(1));
      } else {
        log.push(p);
      }
    });
  const logRE = new RegExp(`^(?:${log.join('|') || '.*'})$`);
  const notRE = new RegExp(`^(?:${not.join('|') || '(?!)'})$`);
  return (topic) => logRE.test(topic) && !notRE.test(topic);
}

function writeLogEntry(output) {
  const timestamp = new Date().toISOString();
  const date = timestamp.substring(0, timestamp.indexOf('T'));
  const filename = `${config.logFile}.${date}.log`;
  const entry = `${timestamp} ${output}${os.EOL}`;
  mkdirs(config.logDir);
  fs.appendFileSync(path.resolve(config.logDir, filename), entry);
}

function getLogFiles() {
  try {
    const files = fs.readdirSync(config.logDir);
    const retval = [];
    for (const file of files) {
      if (file.startsWith(config.logFile + '.') && file.endsWith('.log')) {
        retval.push(file);
      }
    }
    retval.sort();
    return retval;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

function rollLogFiles() {
  const files = getLogFiles();
  if (files.length > config.logFiles) {
    for (let i = 0; i < files.length - config.logFiles; i++) {
      fs.unlinkSync(path.resolve(config.logDir, files[i]));
    }
  }
}

function writeToConsole(sev, output) {
  switch (sev) {
    case ERROR:
      console.error(chalk.redBright(output));
      break;
    case WARN:
      console.error(chalk.magenta(output));
      break;
    case INFO:
      console.log(chalk.blue(output));
      break;
    case DEBUG:
      console.log(chalk.green(output));
      break;
  }
}

class Logger {
  constructor(topic) {
    this._topic = topic;
    this._debug = setDebugFlag(topic);
  }

  error(msg) {
    if (config.logLevel < ERROR) return;
    this._log(ERROR, msg);
  }

  warn(msg) {
    if (config.logLevel < WARN) return;
    this._log(WARN, msg);
  }

  info(msg) {
    if (config.logLevel < INFO) return;
    this._log(INFO, msg);
  }

  debug(msg) {
    if (!this._debug) return;
    this._log(DEBUG, msg);
  }

  _log(sev, msg) {
    const output = `[${LEVELS[sev]}] ${this._topic}: ${msg.toString()}`;
    if (config.logFiles > 0) {
      writeLogEntry(output);
      rollLogFiles();
    }
    if (config.logConsole) {
      writeToConsole(sev, output);
    }
  }

  get latestLogFile() {
    const files = getLogFiles();
    const length = files.length;
    if (length === 0) {
      return null;
    }
    return path.join(config.logDir, files[length - 1]);
  }

  get config() {
    return { logTopic: this._topic, ...config };
  }
}

function pkglogger(topic) {
  // Check for module or import.meta.
  if (topic !== null && typeof topic === 'object') {
    if (typeof topic.filename === 'string') {
      return new Logger(path.basename(topic.filename, '.js'));
    }
    if (typeof topic.url === 'string') {
      const filename = url.fileURLToPath(topic.url);
      if (filename.endsWith('.mjs')) {
        return new Logger(path.basename(filename, '.mjs'));
      } else {
        return new Logger(path.basename(filename, '.js'));
      }
    }
  }
  // Check for string.
  if (typeof topic === 'string') {
    topic = topic.trim();
    if (topic) {
      return new Logger(topic);
    }
  }
  // Return default.
  return new Logger(pkg.packageJson.name);
}

module.exports = pkglogger;
