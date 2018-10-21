// @flow
"use strict";

const test = require("tap").test;
const MapboxStyle = require("../../src/core/MapboxStyle");

test("MapboxStyle", (t) => {

	t.test("#open", (t) => {

		const style = new MapboxStyle("./files/style.json");
		const style2 = new MapboxStyle("./files/style2.json");

		t.resolves(() => style.open(), "Style open");
		t.rejects(() => style2.open(), "Style does not exist");
		t.end();

	});

	t.test("#groupLayerBySource", (t) => {

		const style = new MapboxStyle();
		const layers = [{id: 1, source: "a"}, { id: 2, source: "b"}, {id:3}, {id:4, source:"b"}, {id:5, source: "a"}];

		t.deepEquals(style.groupLayerBySource(layers), {"a": [1, 5], "b": [2, 4]}, "Layers are grouped by source");
		t.end();

	});

	t.test("#mapLayersToObject", (t) => {

		const style = new MapboxStyle();
		const layers = [{id: 1, "source-layer": "a"}, { id: 2, "source-layer": "b"}];

		t.deepEquals(style.mapLayersToObject(layers), {"a": {data : { id: 1, "source-layer": "a"}}, "b": { data: {id: 2, "source-layer": "b"}}}, "Layers are mapped to objects");
		t.end();

	});

	t.test("#getLayerNamesFromSource", async (t) => {

		const style = new MapboxStyle("./files/style.json");
		await style.open();

		t.deepEquals(style.getLayerNamesFromSource("mapbox-streets"), ["water"], "Got source's layers");
		t.end();

	});

	t.test("#isLayerVisibleOnLevel", async (t) => {

		const style = new MapboxStyle("./files/style.json");
		await style.open();

		t.equals(style.isLayerVisibleOnLevel("water", 5), true, "Layer visible");
		t.equals(style.isLayerVisibleOnLevel("water", 30), false, "Layer not visible");
		t.end();

	});

	t.end();

});
