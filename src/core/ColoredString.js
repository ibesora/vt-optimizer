// @flow
"use strict";

const chalk = require("chalk");

class ColoredString {

	static format(color, ...args) {

		return color(...args);

	}

}

ColoredString.blue = chalk.blue;
ColoredString.yellow = chalk.yellow;
ColoredString.red = chalk.red;
ColoredString.green = chalk.green;
ColoredString.white = chalk.white;
ColoredString.bold = chalk.bold;

module.exports = ColoredString;
