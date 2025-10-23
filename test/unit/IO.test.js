// @flow
"use strict";

import { test } from "tap";
import IO from "../../src/core/IO.js";

test("IO", (t) => {

	t.test("#readSync", (t) => {

		t.doesNotThrow(() => IO.readSync("./files/trails.mbtiles"), "Reads an existing file");
		t.throws(() => IO.readSync("./files/trails2.mbtiles"), "Unexisting file");
		t.end();

	});

	t.test("#copyFileSync", (t) => {

		t.doesNotThrow(() => IO.copyFileSync("./files/trails.mbtiles", "./files/trails2.mbtiles"), "Copies an existing file");
		t.doesNotThrow(() => IO.readSync("./files/trails2.mbtiles"), "File exists");
		t.throws(() => IO.copyFileSync("./files/trails3.mbtiles", "./files/aux.mbtiles"), "File does not exists");
		t.end();

	});

	t.test("#deleteFileSync", (t) => {

		t.doesNotThrow(() => IO.deleteFileSync("./files/trails2.mbtiles"), "Deletes an existing file");
		t.throws(() => IO.deleteFileSync("./files/trails2.mbtiles"), "File does not exists");
		t.end();

	});

	t.end();

});
