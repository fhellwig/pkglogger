/*
 * Copyright (c) 2017 Frank Hellwig
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

'use strict'

const os = require('os')
const fs = require('fs')
const path = require('path')
const mkdirs = require('mkdirs')
const pkg = require('pkgfinder')()

const DEFAULT_FILENAME = pkg.name
const DEFAULT_DIRECTORY = pkg.resolve('logs')
const DEFAULT_FILES = 10

class LogWriter {

    constructor(formatter) {
        this._formatter = formatter
        this._filename = DEFAULT_FILENAME
        this._directory = DEFAULT_DIRECTORY
        this._files = DEFAULT_FILES
        Object.seal(this)
    }

    get filename() { return this._filename }
    set filename(value) { this._filename = value }

    get directory() { return this._directory }
    set directory(value) { this._directory = pkg.resolve(value) }

    get files() { return this._files }
    set files(value) { this._files = value }

    writeRecord(record) {
        let output = this._formatter.formatRecord(record) + os.EOL
        let ts = record.timestamp
        let date = ts.substring(0, ts.indexOf('T'))
        let filename = `${this.filename}.${date}.log`
        let directory = this.directory
        mkdirs(directory)
        fs.appendFileSync(path.resolve(directory, filename), output)
        this.rollLogFiles()
    }

    rollLogFiles() {
        let dir = this.readDir()
        if (dir.length > this.files) {
            for (let i = 0; i < dir.length - this.files; i++) {
                fs.unlinkSync(path.resolve(this.directory, dir[i]))
            }
        }
    }

    readDir() {
        let retval = []
        let files = fs.readdirSync(this.directory)
        for (const file of files) {
            if (file.startsWith(this._filename + '.') && file.endsWith('.log')) {
                retval.push(file)
            }
        }
        retval.sort()
        return retval
    }
}

module.exports = LogWriter