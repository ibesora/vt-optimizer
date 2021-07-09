// @flow
"use strict";

const axios = require("axios");

class Utils {

	static async asyncForEach(array, callback) {

		// The usual forEach doesn't wait for the function to finish so if we
		// use an async function it won't work

		for (let index = 0; index < array.length; ++index) {

			await callback(array[index], index, array);

		}

	}

	static toRadians(degrees) {

		return degrees * Math.PI / 180.0;

	}

	static toDegrees(radians) {

		return radians * 180.0 / Math.PI;

	}

	// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Lon..2Flat._to_tile_numbers_2
	static tileX2Lon(x, zoomLevel) {

		return (x / Math.pow(2, zoomLevel) * 360.0 - 180.0);

	}

	static tileY2Lat(y, zoomLevel) {

		const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoomLevel);
		return Utils.toDegrees(Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));

	}

	static lon2TileX(lon, zoomLevel) {

		return (Math.floor((lon + 180) / 360 * Math.pow(2, zoomLevel)));

	}

	static lat2TileY(lat, zoomLevel)  {

		return (Math.floor((1 - Math.log(Math.tan(Utils.toRadians(lat)) + 1 / Math.cos(Utils.toRadians(lat))) / Math.PI) / 2 * Math.pow(2, zoomLevel)));

	}

	static tile2LonLat(zoomLevel, column, row) {

		const lon = Utils.tileX2Lon(column, zoomLevel);
		const lat = Utils.tileY2Lat(row, zoomLevel);

		return {lon, lat};

	}

	static lonLat2Tile(zoomLevel, lon, lat) {

		const row = Utils.lat2TileY(lat, zoomLevel);
		const column = Utils.lon2TileX(lon, zoomLevel);

		return {row, column};

	}

	// From geojson-vt
	static world2NormalizedX(lon) {

		return lon / 360 + 0.5;

	}

	// From geojson-vt
	static world2NormalizedY(lat) {

		const sin = Math.sin(lat * Math.PI / 180);
		const y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
		return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;

	}

	static world2Normalized(lon, lat) {

		return {
			x: Utils.world2NormalizedX(lon),
			y: Utils.world2NormalizedY(lat)
		};

	}

	static normalized2WorldX(x) {

		return (x - 0.5) * 360;

	}

	static normalized2WorldY(y) {

		const y2 = Math.exp(Math.PI * (y - 0.5) / -0.25);
		return Math.asin((y2 - 1) / (1 + y2)) * 180 / Math.PI;

	}

	static normalized2World(x, y) {

		return {
			lon: Utils.normalized2WorldX(x),
			lat: Utils.normalized2WorldY(y)
		};

	}

	// From @mapbox/vector-tile
	static vT2WorldX(zoomLevel, row, extent, x) {

		const size = extent * Math.pow(2, zoomLevel);
		const x0 = extent * row;

		return (x + x0) * 360 / size - 180;

	}

	// From @mapbox/vector-tile
	static vT2WorldY(zoomLevel, column, extent, y) {

		const size = extent * Math.pow(2, zoomLevel);
		const y0 = extent * column;
		const y2 = 180 - (y + y0) * 360 / size;

		return 360 / Math.PI * Math.atan(Math.exp(Utils.toRadians(y2))) - 90;

	}

	static vt2World(zoomLevel, column, row, extent, x, y) {

		return {
			lon: Utils.vT2WorldX(zoomLevel, row, extent, x),
			lat: Utils.vT2WorldY(zoomLevel, column, extent, y)
		};

	}

	static worldX2VT(zoomLevel, row, extent, x) {

		const size = extent * Math.pow(2, zoomLevel);
		const x0 = extent * row;

		return (x + 180) * size / 360 - x0;

	}

	static worldY2VT(zoomLevel, column, extent, y) {

		const size = extent * Math.pow(2, zoomLevel);
		const y0 = extent * column;
		const tan = Math.tan(((y + 90) * Math.PI / 360));
		const a = Utils.toDegrees(Math.log(tan));

		return (180 - a) * size / 360 - y0;

	}

	static world2VT(zoomLevel, column, row, extent, lon, lat) {

		return {
			x: Utils.worldX2VT(zoomLevel, row, extent, lon),
			y: Utils.worldY2VT(zoomLevel, column, extent, lat)
		};

	}

	static async loadFromURL(url) {

		return new Promise((resolve, reject) => {

			axios.get(url, {responseType: "arraybuffer"})
				.then((data) => {

					resolve(data.data);

				},
				(err) => reject(err)
				);

		});

	}

}

module.exports = Utils;
