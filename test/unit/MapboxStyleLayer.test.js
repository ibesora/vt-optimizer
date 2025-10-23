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

		t.end();

	});

	t.test("#areAllPropertiesFilteredOut", (t) => {

		const invisibleLayer = new MapboxStyleLayer({ paint: { "fill-opacity": 0 }});
		t.equal(invisibleLayer.areAllPropertiesFilteredOut(), false);
		t.end();

	});

	t.end();

});
