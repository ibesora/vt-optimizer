// @flow
"use strict";

class DataConverter {

	static mVTLayer2GeoJSON(data, zoomLevel, column, row) {

		return new Promise((resolve) => {

			const features = [];
			for (let i = 0; i < data.length; ++i) {

				const feature = data.feature(i);
				const geoJSON = feature.toGeoJSON(row, column, zoomLevel);
				feature.push(geoJSON);

			}

			resolve({ type: "FeatureCollection", features });

		});

	}

	static geoJSON2MVTLayer() {

		return new Promise((resolve) => {

			resolve();

		});

	}

}

module.exports = DataConverter;
