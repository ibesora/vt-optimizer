// @flow
"use strict";

import commandLineOptions from "./command-line-options.js";

export default [
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
			"$ node index.js -m vtFile -x Row -y Column -z ZoomLevel -l layerName -t tolerance",
			"$ node index.js -m vtFile -x Row -y Column -z ZoomLevel",
			"$ node index.js -u url -x Row -y Column -z ZoomLevel",
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
