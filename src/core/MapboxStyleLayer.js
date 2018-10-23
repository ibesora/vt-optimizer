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

	isRendered(level) {

		const self = this;
		let isRendered = true;

		for (let i = 0; isRendered && i < PaintPropertiesToCheck.length; ++i) {

			isRendered = self.checkPaintPropertyNotZero(PaintPropertiesToCheck[i], level);

		}

		return isRendered;

	}

	checkPaintPropertyNotZero(propertyName, level) {

		const self = this;
		const isObject = self.data.paint && self.data.paint.hasOwnProperty(propertyName) &&
			typeof self.data.paint[propertyName] === "object";

		let isPropertyNotZero = false;

		if (isObject) {

			isPropertyNotZero = self.checkStopNotZeroInLevel(self.data.paint[propertyName], level);

		} else {

			isPropertyNotZero = !self.data.paint || !self.data.paint.hasOwnProperty(propertyName) || self.data.paint[propertyName] !== 0;

		}

		return isPropertyNotZero;

	}

	checkStopNotZeroInLevel(stops, level) {

		let isNotZero = true;

		if (stops.base && stops.stops) {

			const stop = stops.stops.find((elem) => elem[0] === level);

			if (stop) {

				isNotZero = stop && stop[1] !== 0;

			}

		}

		return isNotZero;

	}

	areAllPropertiesFilteredOut() {

		return false;

	}

}

module.exports = MapboxStyleLayer;
