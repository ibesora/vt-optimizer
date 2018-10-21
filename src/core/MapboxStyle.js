// @flow
"use strict";

const IO = require("./IO");
const MapboxStyleLayer = require("./MapboxStyleLayer");

/*
* Loads a Mapbox Style following the specification found in
* https://www.mapbox.com/mapbox-gl-js/style-spec/
*/
class MapboxStyle {

	constructor(fileName) {

		this.style = {};
		this.layerNamesBySource = {};
		this.layerDataById = {};
		this.fileName = fileName;

	}

	open() {

		const self = this;

		return new Promise((resolve, reject) => {

			try {

				self.style = JSON.parse(IO.readSync(self.fileName));
				self.layerNamesBySource = self.groupLayerBySource(self.style.layers);
				self.layerDataById = self.mapLayersToObject(self.style.layers);
				delete self.style.layers;

				resolve();

			} catch (err) {

				reject(err);

			}

		});

	}

	groupLayerBySource(layers) {

		return layers.reduce(
			(obj, val) => {

				// According to the spec the background layers
				// don't have a source thus we omit them
				if (val.source) {

					if (!obj[val.source]) {

						obj[val.source] = [];

					}

					obj[val.source].push(val.id);

				}

				return obj;

			},
			{}
		);

	}

	mapLayersToObject(layers) {

		return layers.reduce(
			(obj, val) => {

				obj[val["source-layer"]] = new MapboxStyleLayer(val);

				return obj;

			},
			{}
		);

	}

	getLayerNamesFromSource(source) {

		const self = this;

		return self.layerNamesBySource[source];

	}

	isLayerVisibleOnLevel(layerName, level) {

		const self = this;
		const layer = self.layerDataById[layerName];

		return layer &&
			layer.isVisibleOnZoomLevel(level) &&
			layer.isRendered() &&
			!layer.areAllPropertiesFilteredOut();

	}

}

module.exports = MapboxStyle;
