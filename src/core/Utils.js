// @flow
"use strict";

class Utils {

	static async asyncForEach(array, callback) {

		// The usual forEach doesn't wait for the function to finnish so if we
		// use an async function it won't work

		for (let index = 0; index < array.length; ++index) {

			await callback(array[index], index, array);

		}

	}

}

module.exports = Utils;
