// @flow
"use strict";

const test = require("tap").test;
const MapboxStyleLayer = require("../../src/core/MapboxStyleLayer");
const PaintPropertiesToCheck = require("../../src/PaintPropertiesToCheck");

test("MapboxStyleLayer", (t) => {

	t.test("#isVisibleOnZoomLevel", (t) => {

		const layer = new MapboxStyleLayer({
			"id": "water",
			"source": "mapbox-streets",
			"source-layer": "water",
			"type": "fill",
			"layout": {
				"visibility": "visible"
			},
			"paint": {
				"fill-color": "#00ffff"
			},
			"minzoom": 10,
			"maxzoom": 13
		});

		t.equals(layer.isVisibleOnZoomLevel(9), false, "Layer not visible on level 9");
		t.equals(layer.isVisibleOnZoomLevel(11), true, "Layer visible on level 11");
		t.equals(layer.isVisibleOnZoomLevel(14), false, "Layer not visible on level 14");
		t.end();

	});

	t.test("#checkLayoutVisibility", (t) => {

		const visibleLayer = new MapboxStyleLayer({});
		const explicitlyVisibleLayer = new MapboxStyleLayer({layout: { visibility: "visible" }});
		const explicitlyNonVisibleLayer = new MapboxStyleLayer({layout: { visibility: "none" }});

		t.equals(visibleLayer.checkLayoutVisibility(), true, "Layer does not have explicit visibility");
		t.equals(explicitlyVisibleLayer.checkLayoutVisibility(), true, "Layer does have explicit visibility");
		t.equals(explicitlyNonVisibleLayer.checkLayoutVisibility(), false, "Layer does have explicit invisibility");
		t.end();

	});

	t.test("#checkZoomUnderflow", (t) => {

		const visibleLayer = new MapboxStyleLayer({});
		const minZoomLayer = new MapboxStyleLayer({minzoom: 4});

		t.equals(visibleLayer.checkZoomUnderflow(5), true, "Min zoom default value");
		t.equals(minZoomLayer.checkZoomUnderflow(5), true, "Min zoom explicitly set and lower than the one we are testing");
		t.equals(minZoomLayer.checkZoomUnderflow(3), false, "Min zoom explicitly set and higher than the one we are testing");
		t.end();

	});

	t.test("#checkZoomOverflow", (t) => {

		const visibleLayer = new MapboxStyleLayer({});
		const maxZoomLayer = new MapboxStyleLayer({maxzoom: 14});

		t.equals(visibleLayer.checkZoomOverflow(5), true, "Max zoom default value");
		t.equals(maxZoomLayer.checkZoomOverflow(5), true, "Max zoom explicitly set and higher than the one we are testing");
		t.equals(maxZoomLayer.checkZoomOverflow(16), false, "Max zoom explicitly set and lower than the one we are testing");
		t.equals(maxZoomLayer.checkZoomOverflow(14), false, "Max zoom explicitly set and equal to the one we are testing");
		t.end();

	});

	t.test("#isRendered", (t) => {

		for(let index in PaintPropertiesToCheck) {

			const layerDef = { paint: {}};
			const property = PaintPropertiesToCheck[index]
			layerDef.paint[property] = 1;
			const visibleLayer = new MapboxStyleLayer(layerDef);
			layerDef.paint[property] = 0;
			const nonVisibleLayer = new MapboxStyleLayer(layerDef);
			t.equals(visibleLayer.isRendered(), true, `Layer with paint property ${property} different than 0. ${JSON.stringify(visibleLayer)}`);
			t.equals(nonVisibleLayer.isRendered(), false, `Layer with paint property ${property} equal to 0. ${JSON.stringify(nonVisibleLayer)}`);

		}

		t.end();

	});

	t.test("#checkPaintPropertyNotZero", (t) => {

		const invisibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0 }});
		const invisibleLayerFloatValue = new MapboxStyleLayer({ paint: { "fill-opacity": 0.0 }});
		const visibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0.5 }});
		t.equals(invisibleLayer.checkPaintPropertyNotZero("fill-opacity"), false, `Layer with fill-opacity equal to 0. ${JSON.stringify(visibleLayer)}`);
		t.equals(invisibleLayerFloatValue.checkPaintPropertyNotZero("fill-opacity"), false, `Layer with fill-opacity equal to 0.0. ${JSON.stringify(visibleLayer)}`);
		t.equals(visibleLayer.checkPaintPropertyNotZero("heatmap-opacity"), true, `Layer with no heatmap-opacity. ${JSON.stringify(visibleLayer)}`);
		t.equals(visibleLayer.checkPaintPropertyNotZero("fill-opacity"), true, `Layer with fill-opacity non 0. ${JSON.stringify(visibleLayer)}`);

		t.end();

	});

	t.test("#areAllPropertiesFilteredOut", (t) => {

		const invisibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0 }});
		t.equals(invisibleLayer.areAllPropertiesFilteredOut(), false);
		t.end();

	});

	t.end();

});
