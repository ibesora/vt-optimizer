// @flow
"use strict";

class Utils {

	static async asyncForEach(array, callback) {

		// The usual forEach doesn't wait for the function to finnish so if we
		// use an async function it won't work

		for (let index = 0; index < array.length; ++index) {

			await callback(array[index], index, array);

		}

	}

	// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Lon..2Flat._to_tile_numbers_2
	static tile2Lon(x, zoomLevel) {

		return (x / Math.pow(2, zoomLevel) * 360.0 - 180.0);

	}

	static tile2Lat(y, zoomLevel) {

		const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoomLevel);
		return (180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));

	}

	static lon2Tile(lon, zoom) {

		return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));

	}

	static lat2Tile(lat, zoom)  {

		return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));

	}

	static tile2LonLat(zoomLevel, row, column) {

		const lon = Utils.tile2Lon(row, zoomLevel);
		const lat = Utils.tile2Lat(column, zoomLevel);

		return {lon, lat};

	}

	static lonLat2Tile(zoomLevel, lon, lat) {

		const row = Utils.lat2Tile(lat, zoomLevel);
		const column = Utils.lon2Tile(lon, zoomLevel);

		return {row, column};

	}

}

module.exports = Utils;
