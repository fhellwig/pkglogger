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
const chalk = require('chalk');
const mkdirs = require('mkdirs');
const pkgfinder = require('pkgfinder');

const ERROR = 0;
const WARN = 1;
const INFO = 2;
const DEBUG = 3;

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'];

const env = process.env;
const pkg = pkgfinder();
const isProduction = env.NODE_ENV === 'production';

const config = {
  logDir: env.LOG_DIR || pkg.resolve('logs'),
  logFile: env.LOG_FILE || pkg.name,
  logFiles: parseInt(env.LOG_FILES) || 5,
  logLevel: parseInt(env.LOG_LEVEL) || (isProduction ? INFO : DEBUG),
  logDebug: env.LOG_DEBUG || env.DEBUG,
  logConsole: !!parseInt(env.LOG_CONSOLE) || !isProduction
};

function writeLogEntry(output) {
  const timestamp = new Date().toISOString();
  const date = timestamp.substring(0, timestamp.indexOf('T'));
  const filename = `${config.logFile}.${date}.log`;
  const entry = `${timestamp} ${output}${os.EOL}`;
  mkdirs(config.logDir);
  fs.appendFileSync(path.resolve(config.logDir, filename), entry);
}

function getLogFiles() {
  const retval = [];
  const files = fs.readdirSync(config.logDir);
  for (const file of files) {
    if (file.startsWith(config.logFile + '.') && file.endsWith('.log')) {
      retval.push(file);
    }
  }
  retval.sort();
  return retval;
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

function getDebugFlag(topic) {
  if (typeof config.logDebug === 'string') {
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
    const logRE = new RegExp(log.map((p) => `(^${p}$)`).join('|') || '.*');
    const notRE = new RegExp(not.map((p) => `(^${p}$)`).join('|') || '(?!)');
    return logRE.test(topic) && !notRE.test(topic);
  }
  return function () {
    return true;
  };
}

class Logger {
  constructor(topic) {
    this._topic = topic;
    this._debug = getDebugFlag(topic);
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
    if (config.logLevel < DEBUG || !this._debug) return;
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
  // Check for module.
  if (topic !== null && typeof topic === 'object') {
    if (typeof topic.filename === 'string') {
      return new Logger(path.basename(topic.filename, '.js'));
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
  return new Logger(pkg.name);
}

module.exports = pkglogger;
