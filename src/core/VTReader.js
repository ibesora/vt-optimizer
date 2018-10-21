// @flow
/*eslint camelcase: ["error", {allow: ["zoom_level", "tile_row", "tile_column"]}]*/
"use strict";

const Pbf = require("pbf");
const zlib = require("zlib");
const SQLite = require("./SQLite");
const { Tile } = require("./vector-tile");

class VTReader {

	constructor(fileName) {

		this.db = new SQLite();
		this.layers = [];
		this.metadata = {};
		this.fileName = fileName;
		this.isOpen = false;
		this.hasData = false;
		this.data = null;

	}

	open(loadInMemory) {

		const self = this;

		return new Promise((resolve, reject) => {

			self.db.open(self.fileName).then(
				() => {

					self.isOpen = true;
					self.parseMetadata().then(() => {

						if (loadInMemory) {

							self.loadTiles().then(() => resolve());

						} else {

							resolve();

						}

					},
					(err) => reject(err)
					);

				},
				(err) => {

					reject(err);

				}
			);

		});

	}

	parseMetadata() {

		const self = this;

		return new Promise((resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			self.db.all("SELECT * FROM metadata").then((rows) => {

				self.metadata = rows.reduce((obj, val) => {

					obj[val.name] = val.value;
					return obj;

				}, {});
				self.parseLayers();
				resolve();

			});

		});

	}

	parseLayers() {

		const self = this;

		const data = JSON.parse(self.metadata["json"]);
		self.layers = data["vector_layers"].map((layer) => layer.id).sort();

	}

	getTiles() {

		const self = this;

		return new Promise((resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			self.db.all("SELECT zoom_level, tile_column, tile_row FROM tiles ORDER BY zoom_level ASC").then((rows) => {

				resolve(rows);

			});

		});

	}

	async loadTiles() {

		const self = this;

		return new Promise((resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			if (!self.hasData) {

				self.db.all("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles ORDER BY zoom_level ASC").then((rows) => {

					self.hasData = true;
					self.data = rows.reduce((obj, val) => {

						obj[`${val["zoom_level"]}_${val["tile_column"]}_${val["tile_row"]}`] = val["tile_data"];
						return obj;

					}, {});
					resolve(rows);

				});

			}

		});

	}

	async getTileData(zoomLevel, column, row) {

		const self = this;

		return new Promise(async (resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			if (self.hasData) {

				self.loadCachedData(resolve, reject, zoomLevel, column, row);

			} else {

				self.loadFromDatabase(resolve, reject, zoomLevel, column, row);

			}

		});

	}

	loadCachedData(resolve, reject, zoomLevel, column, row) {

		const self = this;

		self.unzipTileData(self.data[`${zoomLevel}_${column}_${row}`], resolve, reject);

	}

	unzipTileData(data, resolve, reject) {

		zlib.gunzip(data, (err, buffer) => {

			if (err) {

				reject(err);

			}

			data = Tile.read(new Pbf(buffer));
			resolve(data);

		});

	}

	async loadFromDatabase(resolve, reject, zoomLevel, column, row) {

		const self = this;

		try {

			const rowData = await self.db.get(`SELECT tile_data, length(tile_data) as size FROM tiles WHERE zoom_level=${zoomLevel} AND tile_column=${column} AND tile_row=${row}`);
			const data = await new Promise((resolve) => {

				self.unzipTileData(rowData["tile_data"], resolve, reject)

			});

			resolve(data);

		} catch (error) {

			reject(error);

		}

	}

	getVTSummary() {

		const self = this;

		return new Promise((resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			self.db.all("SELECT zoom_level, COUNT(tile_column) as tiles, SUM(length(tile_data)) as size, AVG(length(tile_data)) as avgTileSize, MAX(length(tile_data)) as maxSize  FROM tiles GROUP BY zoom_level ORDER BY zoom_level ASC").then((rows) => {

				resolve(rows);

			});

		});

	}

	getLevelTiles(level) {

		const self = this;

		return new Promise((resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			self.db.all(`SELECT zoom_level, tile_column, tile_row, length(tile_data) as size FROM tiles WHERE zoom_level=${level}`).then((rows) => {

				resolve(rows.map(row => { return { zoom_level: row.zoom_level, tile_column: row.tile_column, tile_row: row.tile_row, size: row.size/1024.0} }));

			});

		});

	}

	getTooBigTilesNumber() {

		// The mapbox studio classic recommendations state that individual tiles must be less than 500Kb
		// https://www.mapbox.com/help/studio-classic-sources/#tiles-and-file-sizes

		const self = this;

		return new Promise((resolve, reject) => {

			if (!self.isOpen) {

				reject("VT not open");

			}

			self.db.all(`SELECT zoom_level, COUNT(*) as num FROM tiles WHERE length(tile_data) > ${VTReader.tileSizeLimit * 1024} GROUP BY zoom_level ORDER BY zoom_level ASC`).then((rows) => {

				resolve(rows);

			});

		});

	}

}

VTReader.tileSizeLimit = 500;

module.exports = VTReader;
