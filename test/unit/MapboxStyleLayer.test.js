// @flow
"use strict";

import { test } from "tap";
import MapboxStyleLayer from "../../src/core/MapboxStyleLayer.js";
import PaintPropertiesToCheck from "../../src/PaintPropertiesToCheck.js";

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

		t.equal(layer.isVisibleOnZoomLevel(9), false, "Layer not visible on level 9");
		t.equal(layer.isVisibleOnZoomLevel(11), true, "Layer visible on level 11");
		t.equal(layer.isVisibleOnZoomLevel(14), false, "Layer not visible on level 14");
		t.end();

	});

	t.test("#checkLayoutVisibility", (t) => {

		const visibleLayer = new MapboxStyleLayer({});
		const explicitlyVisibleLayer = new MapboxStyleLayer({layout: { visibility: "visible" }});
		const explicitlyNonVisibleLayer = new MapboxStyleLayer({layout: { visibility: "none" }});

		t.equal(visibleLayer.checkLayoutVisibility(), true, "Layer does not have explicit visibility");
		t.equal(explicitlyVisibleLayer.checkLayoutVisibility(), true, "Layer does have explicit visibility");
		t.equal(explicitlyNonVisibleLayer.checkLayoutVisibility(), false, "Layer does have explicit invisibility");
		t.end();

	});

	t.test("#checkZoomUnderflow", (t) => {

		const visibleLayer = new MapboxStyleLayer({});
		const minZoomLayer = new MapboxStyleLayer({minzoom: 4});

		t.equal(visibleLayer.checkZoomUnderflow(5), true, "Min zoom default value");
		t.equal(minZoomLayer.checkZoomUnderflow(5), true, "Min zoom explicitly set and lower than the one we are testing");
		t.equal(minZoomLayer.checkZoomUnderflow(3), false, "Min zoom explicitly set and higher than the one we are testing");
		t.end();

	});

	t.test("#checkZoomOverflow", (t) => {

		const visibleLayer = new MapboxStyleLayer({});
		const maxZoomLayer = new MapboxStyleLayer({maxzoom: 14});

		t.equal(visibleLayer.checkZoomOverflow(5), true, "Max zoom default value");
		t.equal(maxZoomLayer.checkZoomOverflow(5), true, "Max zoom explicitly set and higher than the one we are testing");
		t.equal(maxZoomLayer.checkZoomOverflow(16), false, "Max zoom explicitly set and lower than the one we are testing");
		t.equal(maxZoomLayer.checkZoomOverflow(14), false, "Max zoom explicitly set and equal to the one we are testing");
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
			t.equal(visibleLayer.isRendered(), true, `Layer with paint property ${property} different than 0. ${JSON.stringify(visibleLayer)}`);
			t.equal(nonVisibleLayer.isRendered(), false, `Layer with paint property ${property} equal to 0. ${JSON.stringify(nonVisibleLayer)}`);

		}

		t.end();

	});

	t.test("#checkPaintPropertyNotZero", (t) => {

		const invisibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0 }});
		const invisibleLayerFloatValue = new MapboxStyleLayer({ paint: { "fill-opacity": 0.0 }});
		const visibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0.5 }});
		t.equal(invisibleLayer.checkPaintPropertyNotZero("fill-opacity"), false, `Layer with fill-opacity equal to 0. ${JSON.stringify(visibleLayer)}`);
		t.equal(invisibleLayerFloatValue.checkPaintPropertyNotZero("fill-opacity"), false, `Layer with fill-opacity equal to 0.0. ${JSON.stringify(visibleLayer)}`);
		t.equal(visibleLayer.checkPaintPropertyNotZero("heatmap-opacity"), true, `Layer with no heatmap-opacity. ${JSON.stringify(visibleLayer)}`);
		t.equal(visibleLayer.checkPaintPropertyNotZero("fill-opacity"), true, `Layer with fill-opacity non 0. ${JSON.stringify(visibleLayer)}`);

		// Case where paint property is an object (e.g., a style function)
		const layerWithObjectPaint = new MapboxStyleLayer({
			paint: {
				"fill-opacity": [
					["zoom"],
					[0, 0],
					[10, 1]
				]
			}
		});
		layerWithObjectPaint.checkStopNotZeroInLevel = () => true; // mock the result
		t.equal(layerWithObjectPaint.checkPaintPropertyNotZero("fill-opacity", 5), true, "should evaluate object-based paint property via checkStopNotZeroInLevel");

		t.end();

	});

	t.test("#areAllPropertiesFilteredOut", (t) => {

		const invisibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0 }});
		t.equal(invisibleLayer.areAllPropertiesFilteredOut(), false);
		t.end();

	});

	t.test("#checkStopNotZeroInLevel", (t) => {

		const layer = new MapboxStyleLayer({});

		// Case where stops contains a matching level with non-zero value
		const stops1 = {
			base: 1,
			stops: [
				[5, 1],
				[10, 2]
			]
		};
		t.equal(layer.checkStopNotZeroInLevel(stops1, 5), true, "Matching stop with non-zero value");

		// Case where stops contains a matching level with zero value
		const stops2 = {
			base: 1,
			stops: [
				[5, 0],
				[10, 2]
			]
		};
		t.equal(layer.checkStopNotZeroInLevel(stops2, 5), false, "Matching stop with zero value");

		// Case where stops does not contain matching level
		const stops3 = {
			base: 1,
			stops: [
				[4, 0],
				[10, 2]
			]
		};
		t.equal(layer.checkStopNotZeroInLevel(stops3, 5), true, "No matching stop (default to true)");

		// Case where stops is missing base or stops key
		const stops4 = {
			stops: [
				[5, 0]
			]
		};
		t.equal(layer.checkStopNotZeroInLevel(stops4, 5), true, "Missing base key (default to true)");

		const stops5 = {
			base: 1
		};
		t.equal(layer.checkStopNotZeroInLevel(stops5, 5), true, "Missing stops key (default to true)");

		t.end();
	});
	t.end();

});
