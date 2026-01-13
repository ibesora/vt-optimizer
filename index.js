#!/usr/bin/env node

import CommandLineArgs from "command-line-args";
import CommandLineUsage from "command-line-usage";
import commandLineOptions from "./src/command-line-options.js";
import usageSections from "./src/usage-sections.js";
import VTProcessor from "./src/core/VTProcessor.js";
import Log from "./src/core/Log.js";

try {

	const options = CommandLineArgs(commandLineOptions);

	if (options.help) {

		const usage = CommandLineUsage(usageSections);
		console.log(usage);

	} else if (options.mbtiles) {

		if (options.style) {

			VTProcessor.slim(options.mbtiles, options.style, options.out);

		} else if (options.tolerance) {

			VTProcessor.simplifyTileLayer(options.mbtiles, parseInt(options.zoom),
				parseInt(options.column), parseInt(options.row),
				options.layer, parseFloat(options.tolerance));

		} else if (options.row) {

			VTProcessor.showTileInfo(options.mbtiles, parseInt(options.zoom),
				parseInt(options.column), parseInt(options.row));

		} else {

			// Examination mode
			VTProcessor.showInfo(options.mbtiles);

		}

	} else if (options.PBFUrl) {

		VTProcessor.showURLTileInfo(options.PBFUrl, parseInt(options.zoom),
				parseInt(options.column), parseInt(options.row));

	} else {

		Log.info("Wrong usage. Use -h to see the valid arguments.");

	}

} catch (err) {

	Log.error(err);

}
