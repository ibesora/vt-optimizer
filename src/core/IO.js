// @flow
"use strict";

import fs from "fs";

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

export default IO;
