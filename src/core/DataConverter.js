// @flow
"use strict";

const geojsonvt = require("geojson-vt");
const Pbf = require("pbf");
const { VectorTile } = require("@mapbox/vector-tile");
const vtpbf = require("vt-pbf");
const Utils = require("./Utils");

class DataConverter {

	static async mVTLayers2GeoJSON(tilePBF, zoomLevel, column, row) {

		const layers = {};
		const tile = new VectorTile(new Pbf(tilePBF));
		const layerNames = Object.keys(tile.layers);
		await Utils.asyncForEach(layerNames, async (layerName) => {

			const geojson = await DataConverter.mVTLayer2GeoJSON(tile, layerName, zoomLevel, column, row);
			layers[layerName] = geojson;

		});

		return layers;

	}

	static mVTLayer2GeoJSON(tile, layerName, zoomLevel, column, row) {

		return new Promise((resolve) => {

			const features = [];

			const layerObject = tile.layers[layerName];
			for (let i = 0; i < layerObject.length; ++i) {

				const feature = layerObject.feature(i);
				const geoJSON = feature.toGeoJSON(row, column, zoomLevel);
				features.push(geoJSON);

			}

			resolve({ type: "FeatureCollection", features });

		});

	}

	static async geoJSONs2VTPBF(geojsons, layerToSimplify, tolerance, zoomLevel, column, row) {

		const tiles = {};
		const layerNames = Object.keys(geojsons);
		await Utils.asyncForEach(layerNames, async (layerName) => {

			const tile = await DataConverter.geoJSON2MVTLayer(geojsons[layerName], (layerName === layerToSimplify ? tolerance : 0));
			DataConverter.convertTileCoords(tile, zoomLevel, column, row);
			tiles[layerName] = tile;

		});

		const buffer = vtpbf.fromGeojsonVt(tiles, {version: 2});
		const binBuffer = Buffer.from(buffer);

		return binBuffer;

	}

	static geoJSON2MVTLayer(geojson, tolerance) {

		return new Promise((resolve) => {

			const tileset = geojsonvt(geojson, {
				tolerance: tolerance,
				maxZoom: 0,
				indexMaxZoom: 0,
				indexMaxPoints: 0
			});

			resolve(tileset.tiles[0]);

		});

	}

	static convertTileCoords(tile, zoomLevel, column, row) {

		tile.features.forEach(feature => {

			feature.geometry.forEach(ring => {

				for (let i = 0; i < ring.length; i += 2) {

					const inTileCoordinateX = ring[i];
					const inTileCoordinateY = ring[i + 1];
					const worldCoordinateX = DataConverter.tile2WorldCoordinateX(inTileCoordinateX);
					const worldCoordinateY = DataConverter.tile2WorldCoordinateY(inTileCoordinateY);
					const vTCoordinateX = DataConverter.world2VTCoordinateX(zoomLevel, row, tile.extent, worldCoordinateX);
					const vTCoordinateY = DataConverter.world2VTCoordinateY(zoomLevel, column, tile.extent, worldCoordinateY);

					ring[i] = vTCoordinateX;
					ring[i + 1] = vTCoordinateY;

				}

			});

		});

	}

	// From geojson-vt
	static world2TileCoordinateX(x) {

		return x / 360 + 0.5;

	}

	// From geojson-vt
	static world2TileCoordinateY(y) {

		const sin = Math.sin(y * Math.PI / 180);
		const y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
		return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;

	}


	static tile2WorldCoordinateX(x) {

		return (x - 0.5) * 360;

	}

	static tile2WorldCoordinateY(y) {

		const y2 = Math.exp(Math.PI * (y - 0.5) / -0.25);
		return Math.asin((y2 - 1) / (1 + y2)) * 180 / Math.PI;

	}

	// From @mapbox/vector-tile
	static vT2WorldCoordinateX(zoomLevel, row, extent, x) {

		const size = extent * Math.pow(2, zoomLevel);
		const x0 = extent * row;

		return (x + x0) * 360 / size - 180;

	}

	// From @mapbox/vector-tile
	static vT2WorldCoordinateY(zoomLevel, column, extent, y) {

		const size = extent * Math.pow(2, zoomLevel);
		const y0 = extent * column;
		const y2 = 180 - (y + y0) * 360 / size;

		return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;

	}

	static world2VTCoordinateX(zoomLevel, row, extent, x) {

		const size = extent * Math.pow(2, zoomLevel);
		const x0 = extent * row;

		return (x + 180) * size / 360 - x0;

	}

	static world2VTCoordinateY(zoomLevel, column, extent, y) {

		const size = extent * Math.pow(2, zoomLevel);
		const y0 = extent * column;
		let tan = Math.tan(360 / (y + 90) * Math.PI);
		tan = tan < 0 ? 0 : tan > 1 ? 1 : tan;
		const a = Math.log(tan) * 180 / Math.PI;

		return y0 - ((a - 180) * size) / 360;

	}

}

module.exports = DataConverter;
