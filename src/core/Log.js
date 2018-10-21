// @flow
"use strict";

const ColoredString = require("./ColoredString");
require("console.table");

class Log {

	static log(...args) {

		Log.logMessage(Log.Verbose, args.join(" "));

	}

	static info(...args) {

		Log.logMessage(Log.Info, ColoredString.format(ColoredString.blue, args.join("")));

	}

	static warning(...args) {

		Log.logMessage(Log.Warning, ColoredString.format(ColoredString.yellow, args.join("")));

	}

	static error(...args) {

		Log.logMessage(Log.Error, ColoredString.format(ColoredString.red, args.join("")));

	}

	static title(...args) {

		Log.logMessage(Log.Title, ColoredString.format(ColoredString.blue, args.join("")));

	}

	static table(columns, data) {

		console.table(columns, data);

	}

	static list(title, data) {

		Log.title(title);
		data.forEach(element => Log.log(`• ${element}`));

	}

	static logMessage(errorLevel, text) {

		if (Log.errorLevel >= errorLevel) {

			console.log(text);

		}

	}

}

Log.Verbose = Number.POSITIVE_INFINITY;
Log.Info = 2;
Log.Warning = 1;
Log.Error = 0;
Log.Title = -1;
Log.errorLevel = Log.Verbose;

module.exports = Log;
