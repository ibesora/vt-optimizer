// @flow
"use strict";

const simplify = require("simplify-geojson");

class Simplifier {

	static simplifyGeoJSON(geojson, tolerance) {

		return new Promise((resolve, reject) => {

			try {

				const simplified = simplify(geojson, tolerance);
				resolve(simplified);

			} catch (err) {

				reject(err);

			}

		});

	}

}

module.exports = Simplifier;
