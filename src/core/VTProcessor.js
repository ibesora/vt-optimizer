// @flow
/*eslint camelcase: ["error", {allow: ["zoom_level", "tile_row", "tile_column"]}]*/
"use strict";

const Listr = require("Listr");
const { Observable } = require("rxjs");
const DataConverter = require("./DataConverter");
const IO = require("./IO");
const Log = require("./Log");
const MapboxStyle = require("./MapboxStyle");
const Simplifier = require("./Simplifier");
const UI = require("../UI");
const Utils = require("./Utils");
const VTReader = require("./VTReader");
const VTWriter = require("./VTWriter");

class VTProcessor {

	static showInfo(filename) {

		const reader = new VTReader(filename);

		const tasks = [
			{title: "Parsing VT file contents", task: () => reader.open().catch((err) => {

				throw new Error(err);

			})}
		];

		const taskRunner = new Listr(tasks);
		taskRunner.run().then(
			async () => {

				const {vtSummary, tiles} = await VTProcessor.logInfo(reader);
				UI.printMetadata(reader.metadata.minzoom, reader.metadata.mazoom, reader.metadata.format,
					reader.metadata.center, reader.layers);
				VTProcessor.infoLoop(reader, vtSummary, tiles);

			},
			err => Log.error(err)
		);

	}

	static async logInfo(reader) {

		if (!reader.isOpen) {

			Log.error("VTProcessor::showInfo() ", "VTReader not open");

		}

		try {

			const vtSummary = await reader.getVTSummary();
			const tiles = await reader.getTooBigTilesNumber();
			return {vtSummary, tiles};

		} catch (err) {

			Log.error(err);

		}

	}

	static async infoLoop(reader, vtSummary, tiles) {

		UI.printSummaryTable(vtSummary, tiles, VTProcessor.avgTileSizeLimit, VTProcessor.avgTileSizeWarning, reader.tileSizeLimit);

		while (await UI.wantMoreInfoQuestion()) {

			const selectedLevel = await UI.selectLevelPrompt(vtSummary, VTProcessor.avgTileSizeLimit, VTProcessor.avgTileSizeWarning);
			const {data, buckets} = await VTProcessor.computeLevelInfo(reader, selectedLevel);
			UI.showTileDistributionData(data, VTProcessor.avgTileSizeLimit, VTProcessor.avgTileSizeWarning);

			while (await UI.tilesInBucketQuestion()) {

				const selectedBucket = await UI.selectBucketPrompt(data);
				UI.showBucketInfo(buckets[selectedBucket], reader.tileSizeLimit);

				while (await UI.tileInfoQuestion()) {

					const tileIndex = await UI.selectTilePrompt(buckets[selectedBucket], reader.tileSizeLimit);
					const tileData = await VTProcessor.computeTileData(reader, tileIndex.zoom_level, tileIndex.tile_column, tileIndex.tile_row);
					const vt = await DataConverter.mVTLayers2GeoJSON(tileData.rawPBF, tileIndex.zoom_level, tileIndex.tile_column, tileIndex.tile_row);
					UI.showTileInfo(tileData, vt);
					UI.showBucketInfo(buckets[selectedBucket], reader.tileSizeLimit);

				}

				UI.showTileDistributionData(data, VTProcessor.avgTileSizeLimit, VTProcessor.avgTileSizeWarning);

			}

			UI.printSummaryTable(vtSummary, tiles, VTProcessor.avgTileSizeLimit, VTProcessor.avgTileSizeWarning);

		}

	}

	static async computeLevelInfo(reader, zoomLevel) {

		const levelTiles = await reader.getLevelTiles(zoomLevel);
		levelTiles.sort((a, b) => a.size - b.size);

		const buckets = [];
		const data = [];
		let tiles = [];
		const numBuckets = 10;
		let minSize = levelTiles[0].size;
		const maxSize = levelTiles[levelTiles.length - 1].size;
		const totalSize = levelTiles.reduce((accum, elem) => accum + elem.size, 0);
		const totalNumTiles = levelTiles.length;
		const bucketSize = (maxSize - minSize) / numBuckets;
		let currentBucketMaxSize = minSize + bucketSize;
		let processedTilesSize = 0;

		for (let i = 0; i < totalNumTiles; ++i) {

			if (levelTiles[i].size <= currentBucketMaxSize) {

				tiles.push(levelTiles[i]);

			} else {

				VTProcessor.addTilesToBucket(minSize, currentBucketMaxSize, totalNumTiles,
					totalSize, tiles, i, processedTilesSize, buckets, data);

				tiles = [levelTiles[i]];
				minSize = currentBucketMaxSize;
				currentBucketMaxSize += bucketSize;

			}

			processedTilesSize += levelTiles[i].size;

		}

		VTProcessor.addTilesToBucket(minSize, currentBucketMaxSize, totalNumTiles,
			totalSize, tiles, totalNumTiles, processedTilesSize, buckets, data);

		return {data, buckets};

	}

	static addTilesToBucket(minSize, maxSize, totalNumTiles, totalSize, tiles, processedTiles, processedTilesSize, buckets, data) {

		const currentBucketSize = tiles.reduce((accum, elem) => accum + elem.size, 0);
		const currentBucketSizePc = (currentBucketSize / totalSize) * 100.0;
		const currentPc = (tiles.length / totalNumTiles) * 100.0;
		const runningAvgSize = (processedTilesSize / processedTiles);
		let accumPc = 0;
		let accumBucketSizePc = 0;

		if (data.length !== 0) {

			accumPc = data[data.length - 1].accumPc;	// Restore previous accumulated %
			accumBucketSizePc = data[data.length - 1].accumBucketSizePc;	// Restore previous accumulated bucket size %

		}

		accumPc += currentPc;
		accumBucketSizePc += currentBucketSizePc;

		data.push({
			minSize,
			maxSize,
			length: tiles.length,
			runningAvgSize,
			currentPc,
			currentBucketSizePc,
			accumPc,
			accumBucketSizePc
		});
		buckets.push(tiles);

	}

	static async computeTileData(reader, zoomLevel, column, row) {

		const tileData = await reader.getTileData(zoomLevel, column, row);
		return tileData;

	}

	static slim(inputFile, styleFile, outputFile) {

		const outputFileName = outputFile || `${inputFile.slice(0, -8)}_out.mbtiles`;
		const reader = new VTReader(inputFile);
		const style = new MapboxStyle(styleFile);
		const writer = new VTWriter(outputFileName);

		const tasks = [
			{
				title: "Parsing VT file contents",
				task: () => reader.open(true).catch(err => {

					throw new Error(err);

				})
			},
			{
				title: "Parsing the style file",
				task: () => {

					style.open();

				}
			},
			{
				title: "Processing tiles",
				task: (ctx) => {

					return new Observable(observer => {

						VTProcessor.slimVT(reader, style, observer).then((data) => {

							ctx.newVTData = data.newVTData;
							ctx.removedLayers = data.removedLayers;
							observer.complete();

						});

					});

				}
			},
			{
				title: `Writing output file to ${outputFileName}`,
				task: (ctx) => {

					return new Promise(async (resolve, reject) => {

						IO.copyFileSync(inputFile, outputFileName);

						try {

							await writer.open();
							await writer.write(ctx.newVTData);
							resolve();

						} catch (error) {

							IO.deleteFileSync(outputFileName);
							reject(error);

						}

					});

				}
			}
		];

		const taskRunner = new Listr(tasks);
		taskRunner.run()
			.then(
				ctx => UI.printSlimProcessResults(ctx.removedLayers)
				,
				err => Log.error(err)
			);

	}

	static slimVT(reader, styleParser, observer) {

		const newVTData = [];
		const removedLayers = { perLevel: {}, perLayerName: {}};

		return new Promise((resolve) => {

			reader.getTiles().then(async (indexes) => {

				let lastLevelProcessed = Infinity;

				await Utils.asyncForEach(indexes, async (tileIndex, loopIndex) => {

					await reader.getTileData(tileIndex.zoom_level, tileIndex.tile_column, tileIndex.tile_row).then(data => {

						delete data.rawPBF;
						VTProcessor.addTileLayersIfVisible(styleParser, data, tileIndex, newVTData, removedLayers);

						if (tileIndex.zoom_level !== lastLevelProcessed || (loopIndex % 100 === 0)) {

							observer.next(`Processing level ${tileIndex.zoom_level} tiles. Current progress: ${((loopIndex / indexes.length) * 100.0).toFixed(4)}%`);
							lastLevelProcessed = tileIndex.zoom_level;

						}

					});

				});

				observer.complete();
				resolve({newVTData, removedLayers});

			});

		});

	}

	static addTileLayersIfVisible(styleParser, tileData, tileIndex, newVTData, removedLayers) {

		const newVTLayers = [];
		const layers = Object.keys(tileData.layers);

		for (const index of layers) {

			const layer = tileData.layers[index];
			if (styleParser.isLayerVisibleOnLevel(layer.name, tileIndex.zoom_level)) {

				newVTLayers.push(layer);

			} else {

				VTProcessor.addLayerToRemovedLayers(tileIndex.zoom_level, layer, removedLayers);
				tileData.layers[index] = null;	// Free the memory allocated to this layer as we won't need it anymore

			}

		}

		newVTData.push({
			zoom_level : tileIndex.zoom_level,
			tile_column : tileIndex.tile_column,
			tile_row : tileIndex.tile_row,
			layers : newVTLayers
		});

	}

	static addLayerToRemovedLayers(zoomLevel, layer, layerSet) {

		if (!layerSet.perLevel.hasOwnProperty(zoomLevel)) {

			layerSet.perLevel[zoomLevel] = 0;

		}

		layerSet.perLevel[zoomLevel] += layer.features.length;

		if (!layerSet.perLayerName.hasOwnProperty(layer.name)) {

			layerSet.perLayerName[layer.name] = new Set();

		}

		layerSet.perLayerName[layer.name].add(zoomLevel);

	}

	static simplifyTileLayer(inputFile, zoomLevel, column, row, layerName, tolerance) {

		const reader = new VTReader(inputFile);
		const writer = new VTWriter(inputFile);

		const tasks = [
			{
				title: "Opening VT",
				task: () => reader.open().catch(err => {

					throw new Error(err);

				})
			},
			{
				title: "Reading tile",
				task: (ctx) => {

					return new Promise(async (resolve, reject) => {

						await reader.getTileData(zoomLevel, column, row)
							.then(data => {

								ctx.tileData = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			},
			{
				title: "Converting to GeoJSON",
				task: (ctx) => {

					return new Promise((resolve, reject) => {

						DataConverter.mVTLayers2GeoJSON(ctx.tileData.rawPBF, zoomLevel, column, row)
							.then((data) => {

								ctx.geojsons = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			},
			{
				title: `Simplifying layer ${layerName}`,
				task: (ctx) => {

					return new Promise((resolve, reject) => {

						const layerToSimplify = ctx.geojsons[layerName];

						if (!layerToSimplify) {

							reject(`There is not a layer with name ${layerName} in the specified tile`);

						}

						ctx.startingCoordinatesNum = layerToSimplify.features.reduce((accum, feature) => accum + feature.geometry.coordinates.reduce((accum, ring) => (ring.length ? accum + ring.length : feature.geometry.coordinates.length / 2), 0), 0);
						Simplifier.simplifyGeoJSON(layerToSimplify, tolerance)
							.then(data => {

								ctx.simplifiedCoordinatesNum = data.features.reduce((accum, feature) => accum + feature.geometry.coordinates.reduce((accum, ring) => (ring.length ? accum + ring.length : feature.geometry.coordinates.length / 2), 0), 0);
								ctx.geojsons[layerName] = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			},
			{
				title: "Converting back to MVT",
				task: (ctx) => {

					return new Promise((resolve, reject) => {

						DataConverter.geoJSONs2VTPBF(ctx.geojsons, zoomLevel, column, row, ctx.tileData.layers[0].extent)
							.then((data) => {

								ctx.mvt = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			},
			{
				title: `Updating file ${inputFile}`,
				task: (ctx) => {

					return new Promise(async (resolve, reject) => {

						try {

							await writer.open();
							await writer.writeTile(ctx.mvt, zoomLevel, column, row);
							resolve();

						} catch (error) {

							reject(error);

						}

					});

				}
			}
		];

		const taskRunner = new Listr(tasks);
		taskRunner.run()
			.then((ctx) => {

				Log.log(`Layer reduction ${((1.0 - ctx.simplifiedCoordinatesNum / ctx.startingCoordinatesNum) * 100.0).toFixed(2)}% (from ${ctx.startingCoordinatesNum} to ${ctx.simplifiedCoordinatesNum} vertices)`);

			})
			.catch(err => Log.error(err));

	}

	static showTileInfo(filename, zoomLevel, column, row) {

		const reader = new VTReader(filename);

		const tasks = [
			{
				title: "Opening VT",
				task: () => reader.open().catch(err => {

					throw new Error(err);

				})
			},
			{
				title: "Reading tile",
				task: (ctx) => {

					return new Promise(async (resolve, reject) => {

						await reader.getTileData(zoomLevel, column, row)
							.then(data => {

								ctx.tileData = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			},
			{
				title: "Converting to GeoJSON",
				task: (ctx) => {

					return new Promise((resolve, reject) => {

						DataConverter.mVTLayers2GeoJSON(ctx.tileData.rawPBF, zoomLevel, column, row)
							.then((data) => {

								ctx.geojsons = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			}
		];

		const taskRunner = new Listr(tasks);
		taskRunner.run().then(
			async (ctx) => {

				Log.log(JSON.stringify(ctx.geojsons));

			},
			err => Log.error(err)
		);

	}

	static showURLTileInfo(url, zoomLevel, column, row) {

		const tasks = [
			{
				title: "Downloading PBF",
				task: (ctx) => {

					return new Promise((resolve, reject) => {

						Utils.loadFromURL(url)
							.then((data) => {

								ctx.pbf = data;
								resolve();

							})
							.catch(err => {

								reject(err);

							});

					});

				}
			},
			{
				title: "Converting to GeoJSON",
				task: (ctx) => {

					return new Promise((resolve, reject) => {

						DataConverter.mVTLayers2GeoJSON(ctx.pbf, zoomLevel, column, row)
							.then((data) => {

								ctx.geojsons = data;
								resolve();

							},
							(err) => reject(err)
							);

					});

				}
			}
		];

		const taskRunner = new Listr(tasks);
		taskRunner.run().then(
			async (ctx) => {

				Log.log(JSON.stringify(ctx.geojsons));

			},
			err => Log.error(err)
		);

	}

}

VTProcessor.avgTileSizeWarning = 45;
VTProcessor.avgTileSizeLimit = 50;

module.exports = VTProcessor;
