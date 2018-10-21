// @flow
"use strict";

const PaintPropertiesToCheck = require("../PaintPropertiesToCheck");

/*
* Represents a layer according to the specification found in
* https://www.mapbox.com/mapbox-gl-js/style-spec/
*/
class MapboxStyleLayer {

	constructor(data) {

		this.data = JSON.parse(JSON.stringify(data));	// Deep clone of the object

	}

	isVisibleOnZoomLevel(level) {

		const self = this;

		return self.checkLayoutVisibility() &&
			self.checkZoomUnderflow(level) &&
			self.checkZoomOverflow(level);

	}

	checkLayoutVisibility() {

		const self = this;

		return !self.data.layout || self.data.layout.visibility === "visible";

	}

	checkZoomUnderflow(level) {

		const self = this;

		return !self.data.minzoom || level >= self.data.minzoom;

	}

	checkZoomOverflow(level) {

		const self = this;

		// Mapbox style spec states that "At zoom levels equal to or greater than the maxzoom, the layer will be hidden"
		return !self.data.maxzoom || self.data.maxzoom > level;

	}

	isRendered() {

		const self = this;
		let isRendered = true;

		for (let i = 0; isRendered && i < PaintPropertiesToCheck.length; ++i) {

			isRendered = self.checkPaintPropertyNotZero(PaintPropertiesToCheck[i]);

		}

		return isRendered;

	}

	checkPaintPropertyNotZero(propertyName) {

		const self = this;

		return !self.data.paint || !self.data.paint.hasOwnProperty(propertyName) || self.data.paint[propertyName] !== 0;

	}

	areAllPropertiesFilteredOut() {

		return false;

	}

}

module.exports = MapboxStyleLayer;
