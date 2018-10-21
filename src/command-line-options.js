// @flow
"use strict";

module.exports = [
	{name: "help", alias: "h", type: Boolean, description: "Display this usage guide"},
	{name: "mbtiles", alias: "m", type: String, description: "The input .mbtile to process"},
	{name: "style", alias: "s", type: String, description: "The input style to process"},
	{name: "out", alias: "o", type: String, description: "The output file" },
	{name: "verbose", alias: "b", type: Boolean, description: "Create verbose logs"}
];
