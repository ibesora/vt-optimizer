// @flow
"use strict";

const test = require("tap").test;
const DataConverter = require("../../src/core/DataConverter");

test("DataConverter", (t) => {

	function almostEqual(a, b) {

		return Math.abs(a - b) < 0.00001;

	}

	t.test("#world2TileCoordinateX - tile2WorldCoordinateX", (t) => {

		const coordX = 42.123456;
		t.ok(almostEqual(DataConverter.tile2WorldCoordinateX(DataConverter.world2TileCoordinateX(coordX)), coordX));
		t.end();

	});

	t.test("#world2TileCoordinateY - tile2WorldCoordinateY", (t) => {

		const coordY = 1.123456;
		t.ok(almostEqual(DataConverter.tile2WorldCoordinateY(DataConverter.world2TileCoordinateY(coordY)), coordY));
		t.end();

	});

	t.test("#world2VTCoordinateX - vT2WorldCoordinateX", (t) => {

		const zoom = 7;
		const row = 79;
		const extent = 4096;
		const coordX = 42.123456;
		t.ok(almostEqual(DataConverter.vT2WorldCoordinateX(zoom, row, extent, DataConverter.world2VTCoordinateX(zoom, row, extent, coordX)), coordX));
		t.end();

	});

	t.test("#world2VTCoordinateY - vT2WorldCoordinateY", (t) => {

		const zoom = 7;
		const column = 64;
		const extent = 4096;
		const coordY = 1.123456;
		console.log(DataConverter.world2VTCoordinateY(zoom, column, extent, coordY));
		t.ok(almostEqual(DataConverter.vT2WorldCoordinateY(zoom, column, extent, DataConverter.world2VTCoordinateY(zoom, column, extent, coordY)), coordY));
		t.end();

	});

	t.end();

});
