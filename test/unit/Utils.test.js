// @flow
"use strict";

const test = require("tap").test;
const Utils = require("../../src/core/Utils");

test("Utils", (t) => {

	function almostEqual(a, b) {

		return Math.abs(a - b) < 0.00001;

	}

	t.test("#toRadians - toDegrees", (t) => {

		const coordX = 90;
		const coordY = 40.25;
		t.ok(almostEqual(Utils.toRadians(Utils.toDegrees(coordX)), coordX));
		t.ok(almostEqual(Utils.toRadians(Utils.toDegrees(coordY)), coordY));
		t.end();

	});

	t.test("#tile2Lon - lon2Tile", (t) => {

		const zoomLevel = 7;
		const tileX = 79;
		t.ok(almostEqual(Utils.lon2TileX(Utils.tileX2Lon(tileX, zoomLevel), zoomLevel), tileX));
		t.end();

	});

	t.test("#tile2Lat - lat2Tile", (t) => {

		const zoomLevel = 7;
		const tileY = 64;
		t.ok(almostEqual(Utils.lat2TileY(Utils.tileY2Lat(tileY, zoomLevel), zoomLevel), tileY));
		t.end();

	});

	t.test("#lonLat2Tile - tile2LonLat", (t) => {

		const lon = 0;
		const lat = 43.068887;
		const zoomLevel = 7;
		const {row, column} = Utils.lonLat2Tile(zoomLevel, lon, lat);
		const lonlat = Utils.tile2LonLat(zoomLevel, column, row);
		t.ok(almostEqual(lon, lonlat.lon));
		t.ok(almostEqual(lat, lonlat.lat));
		t.end();

	});

	t.test("#world2NormalizedX - normalized2WorldX", (t) => {

		const coordX = 42.123456;
		t.ok(almostEqual(Utils.normalized2WorldX(Utils.world2NormalizedX(coordX)), coordX));
		t.end();

	});

	t.test("#world2NormalizedY - normalized2WorldY", (t) => {

		const coordY = 1.123456;
		t.ok(almostEqual(Utils.normalized2WorldY(Utils.world2NormalizedY(coordY)), coordY));
		t.end();

	});

	t.test("#world2Normalized - normalized2World", (t) => {

		const lon = 1.123456;
		const lat = 42.123456;
		const {x, y} = Utils.world2Normalized(lon, lat);
		const lonlat = Utils.normalized2World(x, y);
		t.ok(almostEqual(lon, lonlat.lon));
		t.ok(almostEqual(lat, lonlat.lat));
		t.end();

	});

	t.test("#world2VTX - vT2WorldX", (t) => {

		const zoom = 7;
		const row = 79;
		const extent = 4096;
		const coordX = 42.123456;
		t.ok(almostEqual(Utils.vT2WorldX(zoom, row, extent, Utils.worldX2VT(zoom, row, extent, coordX)), coordX));
		t.end();

	});

	t.test("#world2VTY - vT2WorldY", (t) => {

		const zoom = 7;
		const extent = 4096;
		const lon = 1.123456;
		const column = Utils.lon2TileX(lon, zoom);
		t.ok(almostEqual(Utils.vT2WorldY(zoom, column, extent, Utils.worldY2VT(zoom, column, extent, lon)), lon));
		t.end();

	});

	t.test("#loadFromURL", (t) => {

		t.resolves(Utils.loadFromURL("https://geoserveis.icgc.cat/data/planet/1/1/1.pbf"));
		t.end();

	});

	t.end();

});
