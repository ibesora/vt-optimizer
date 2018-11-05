// @flow
"use strict";

module.exports = [
	{name: "help", alias: "h", type: Boolean, description: "Display this usage guide"},
	{name: "mbtiles", alias: "m", type: String, description: "The input .mbtile to process"},
	{name: "style", alias: "s", type: String, description: "The input style to process"},
	{name: "out", alias: "o", type: String, description: "The output file" },
	{name: "row", alias: "x", type: String, description: "The X coordinate of a tile" },
	{name: "column", alias: "y", type: String, description: "The Y coordinate of a tile" },
	{name: "zoom", alias: "z", type: String, description: "The Z coordinate of a tile" },
	{name: "tolerance", alias: "t", type: String, description: "The simplification tolerance" },
	{name: "layer", alias: "l", type: String, description: "The name of the layer we want to simplify" },
	{name: "verbose", alias: "b", type: Boolean, description: "Create verbose logs"},
	{name: "PBFUrl", alias: "u", type: String, description: "The URL of a PBF buffer we want to examine"},
];
