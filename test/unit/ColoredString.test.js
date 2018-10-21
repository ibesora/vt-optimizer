// @flow
"use strict";

const test = require("tap").test;
const ColoredString = require("../../src/core/ColoredString");

test("ColoredString", (t) => {

	t.test("#format does not change text", (t) => {

		t.equals(ColoredString.format(ColoredString.blue, "test"), "test");
		t.end();

	});

	t.end();

});
