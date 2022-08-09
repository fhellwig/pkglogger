/*
 * Copyright (c) 2022 Frank Hellwig
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

import chalk from 'chalk';
import { appendFileSync, readdirSync, unlinkSync } from 'fs';
import { mkdirs } from 'mkdirs';
import { EOL } from 'os';
import { basename, dirname, join, resolve } from 'path';
import { readPackageUpSync } from 'read-pkg-up';
import { fileURLToPath } from 'url';

const ERROR = 0;
const WARN = 1;
const INFO = 2;
const DEBUG = 3;

const DEFAULT_LEVEL = INFO;

const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
const chalkfn = [chalk.redBright, chalk.magenta, chalk.blue, chalk.green];

const pkg = readPackageUpSync();
const env = process.env;

const isTTY = process.stderr.isTTY;
const isProduction = env.NODE_ENV === 'production';

const config = {
  logDir: env.LOG_DIR || join(dirname(pkg.path), 'logs'),
  logFile: env.LOG_FILE || pkg.packageJson.name,
  logFiles: parseInt(env.LOG_FILES) || 5,
  logLevel: getLogLevel(),
  logDebug: env.LOG_DEBUG || env.DEBUG
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

function writeLogEntry(entry) {
  const date = entry.substring(0, entry.indexOf('T'));
  const filename = `${config.logFile}.${date}.log`;
  mkdirs(config.logDir);
  appendFileSync(resolve(config.logDir, filename), entry);
}

function getLogFiles() {
  try {
    const files = readdirSync(config.logDir);
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
      unlinkSync(resolve(config.logDir, files[i]));
    }
  }
}

function formatEntry(topic, sev, msg, isTTY) {
  const timestamp = new Date().toISOString();
  const level = LEVELS[sev];
  const str = msg instanceof Error ? msg.message : msg.toString();
  if (isTTY) {
    return `${level} ${topic}: ${str}${EOL}`;
  } else {
    return `${timestamp} [${process.pid}] ${level} ${topic}: ${str}${EOL}`;
  }
}

export function createLog(topic) {
  // Check for module or import.meta.
  if (topic !== null && typeof topic === 'object') {
    if (typeof topic.filename === 'string') {
      if (filename.endsWith('.cjs')) {
        return new Logger(basename(topic.filename, '.cjs'));
      } else {
        return new Logger(basename(topic.filename, '.js'));
      }
    }
    if (typeof topic.url === 'string') {
      const filename = fileURLToPath(topic.url);
      if (filename.endsWith('.mjs')) {
        return new Logger(basename(filename, '.mjs'));
      } else {
        return new Logger(basename(filename, '.js'));
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
    const entry = formatEntry(this._topic, sev, msg, false);
    if (config.logFiles > 0) {
      writeLogEntry(entry);
      rollLogFiles();
    }
    if (isTTY && !isProduction) {
      const entry = formatEntry(this._topic, sev, msg, true);
      process.stderr.write(chalkfn[sev](entry));
    }
  }

  get latestLogFile() {
    const files = getLogFiles();
    const length = files.length;
    if (length === 0) {
      return null;
    }
    return join(config.logDir, files[length - 1]);
  }

  get config() {
    return { logTopic: this._topic, ...config };
  }
}
