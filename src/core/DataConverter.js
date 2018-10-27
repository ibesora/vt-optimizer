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

	static async geoJSONs2VTPBF(geojsons, zoomLevel, column, row, extent) {

		const tiles = {};
		const layerNames = Object.keys(geojsons);
		await Utils.asyncForEach(layerNames, async (layerName) => {

			const tile = await DataConverter.geoJSON2MVTLayer(geojsons[layerName]);
			DataConverter.convertTileCoords(tile, zoomLevel, column, row, extent);
			tiles[layerName] = tile;

		});

		const buffer = vtpbf.fromGeojsonVt(tiles, {version: 2});
		const binBuffer = Buffer.from(buffer);

		return binBuffer;

	}

	static geoJSON2MVTLayer(geojson) {

		return new Promise((resolve) => {

			const tileset = geojsonvt(geojson, {
				tolerance: 0,
				maxZoom: 0,
				indexMaxZoom: 0,
				indexMaxPoints: 0
			});

			resolve(tileset.tiles[0]);

		});

	}

	static convertTileCoords(tile, zoomLevel, column, row, extent) {

		tile.features.forEach(feature => {

			if (feature.type === 1) {

				feature.geometry = [feature.geometry];

			}

			feature.geometry.forEach(ring => {

				for (let i = 0; i < ring.length; i += 2) {

					const inTileCoordinateX = ring[i];
					const inTileCoordinateY = ring[i + 1];
					const worldCoordinateX = Utils.normalized2WorldX(inTileCoordinateX);
					const worldCoordinateY = Utils.normalized2WorldY(inTileCoordinateY);
					const vTCoordinateX = Utils.worldX2VT(zoomLevel, row, extent, worldCoordinateX);
					const vTCoordinateY = Utils.worldY2VT(zoomLevel, column, extent, worldCoordinateY);

					ring[i] = vTCoordinateX;
					ring[i + 1] = vTCoordinateY;

				}

			});

		});

	}

}

module.exports = DataConverter;
