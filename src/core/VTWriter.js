// @flow
/*eslint camelcase: ["error", {allow: ["zoom_level", "tile_row", "tile_column"]}]*/
"use strict";

const Pbf = require("Pbf");
const zlib = require("zlib");
const SQLite = require("./SQLite");
const Utils = require("./Utils");
const { Tile } = require("./vector-tile");

class VTWriter {

	constructor(fileName) {

		this.db = new SQLite();
		this.fileName = fileName;

	}

	open() {

		const self = this;

		return new Promise((resolve, reject) => {

			self.db.open(self.fileName).then(
				() => {

					self.isOpen = true;
					resolve();

				},
				(err) => {

					reject(err);

				}
			);

		});

	}

	write(data) {

		const self = this;

		return new Promise(async (resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			try {

				await self.updateOrRemoveImages(data);
				await self.updateMetadata();
				resolve();

			} catch (error) {

				reject(error);

			}

		});

	}

	async updateOrRemoveImages(data) {

		const self = this;

		return new Promise(async (resolve, reject) => {

			try {

				await self.db.beginTransaction();

				await Utils.asyncForEach(data, async element => {

					if (element.layers.length !== 0) {

						const pbf = new Pbf();
						Tile.write(element, pbf);
						const buffer = pbf.finish();
						const binBuffer = Buffer.from(buffer);
						const compressedBuffer = zlib.gzipSync(binBuffer, {level: zlib.constants.Z_BEST_COMPRESSION});

						await self.updateImage(element.zoom_level, element.tile_row, element.tile_column, compressedBuffer);

					} else {

						await self.deleteImage(element.zoom_level, element.tile_row, element.tile_column);

					}

				});

				await self.db.endTransaction();

				// Updates the file size on disk by freeing the empty space left behind by the deletes
				await self.vacuum();
				resolve();

			} catch (error) {

				reject(error);

			}

		});

	}

	updateImage(zoom_level, tile_row, tile_column, data) {

		const self = this;

		return self.db.run(`UPDATE images SET tile_data=(?) WHERE tile_id=(SELECT tile_id FROM map WHERE zoom_level=${zoom_level} AND tile_row=${tile_row} AND tile_column=${tile_column} LIMIT 1)`, data);

	}

	deleteImage(zoom_level, tile_row, tile_column) {

		const self = this;

		return self.db.run(`DELETE FROM images WHERE tile_id=(SELECT tile_id FROM map WHERE zoom_level=${zoom_level} AND tile_row=${tile_row} AND tile_column=${tile_column} LIMIT 1)`);

	}

	async vacuum() {

		const self = this;

		return self.db.run("VACUUM");

	}

	async updateMetadata() {

		const self = this;
		const bounds = "-180.0,-85.0511,180.0,85.0511";

		const rows = await self.db.get("SELECT * FROM metadata WHERE name='bounds'");

		if (rows) {

			return self.db.run(`UPDATE metadata SET value="${bounds}" WHERE name='bounds'`);

		} else {

			return self.db.run(`INSERT INTO metadata(name, value) VALUES("bounds", "${bounds}")`);

		}

	}

	async writeTile(binaryBuffer, z, y, x) {

		const self = this;

		const compressedBuffer = zlib.gzipSync(binaryBuffer, {level: zlib.constants.Z_BEST_COMPRESSION});
		await self.updateImage(z, x, y, compressedBuffer);

	}

}

module.exports = VTWriter;
