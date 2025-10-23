// @flow
"use strict";

const test = require("tap").test;
const ColoredString = require("../../src/core/ColoredString");

test("ColoredString", (t) => {

	t.test("#format does change text", (t) => {

		t.not(ColoredString.format(ColoredString.blue, "test"), "test");
		t.end();

	});

	t.end();

});
