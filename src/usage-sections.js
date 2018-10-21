// @flow
"use strict";

const commandLineOptions = require("./command-line-options");

module.exports = [
	{
		header: "Vector Tile Weight Loser",
		content: "Reduces a Mapbox VT file removing all the layers not used in a style"
	},
	{
		header: "Options",
		optionList: commandLineOptions

	},
	{
		header: "Synopsis",
		content: [
			"$ node index.js -m vtFile",
			"$ node index.js -m vtFile -s styleFile",
			"$ node index.js -m vtFile -s styleFile -o outputFile",
			"$ node index.js --help",
		]
	},
	{
		content: [
			"Project home: https://github.com/ibesora/vt-optimizer",
			"Made with love by @ibesora"
		]
	}
];
