// @flow
"use strict";

const fs = require("fs");

class IO {

	static readSync(filename) {

		return fs.readFileSync(filename);

	}

	static copyFileSync(srcFile, destFile) {

		return fs.copyFileSync(srcFile, destFile);

	}

	static deleteFileSync(fileName) {

		return fs.unlinkSync(fileName);

	}

}

module.exports = IO;
