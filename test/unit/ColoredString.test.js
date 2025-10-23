// @flow
"use strict";

import { test } from "tap";
import ColoredString from "../../src/core/ColoredString.js";

test("ColoredString", (t) => {

	t.test("#format does change text", (t) => {

		t.not(ColoredString.format(ColoredString.blue, "test"), "test");
		t.end();

	});

	t.end();

});
