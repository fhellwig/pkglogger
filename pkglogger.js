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

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

const env = process.env;
const pkg = pkgfinder();
const isProduction = env.NODE_ENV === 'production';

const config = {
  logDir: env.LOG_DIR || pkg.resolve('logs'),
  logFile: env.LOG_FILE || pkg.name,
  logFiles: parseInt(env.LOG_FILES) || 5,
  logLevel: parseInt(env.LOG_LEVEL) || (isProduction ? 2 : 4),
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
    case 0:
      console.error(chalk.redBright(output));
      break;
    case 1:
      console.error(chalk.magenta(output));
      break;
    case 2:
      console.log(chalk.blue(output));
      break;
    case 3:
      console.log(chalk.green(output));
      break;
    case 4:
      console.log(output);
      break;
  }
}

class Logger {
  constructor(topic) {
    this._topic = topic;
  }

  error(msg) {
    this._log(0, msg);
  }

  warn(msg) {
    this._log(1, msg);
  }

  info(msg) {
    this._log(2, msg);
  }

  debug(msg) {
    this._log(3, msg);
  }

  trace(msg) {
    this._log(4, msg);
  }

  _log(sev, msg) {
    if (sev > config.logLevel) {
      return;
    }
    const level = LEVELS[sev];
    //const message = typeof msg === 'string' ? msg : msg.message;
    const message = msg.toString();
    const output = `[${level}] ${this._topic}: ${message}`;
    if (config.logFiles > 0) {
      writeLogEntry(output);
      rollLogFiles();
    }
    if (config.logConsole) {
      writeToConsole(sev, output);
    }
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
