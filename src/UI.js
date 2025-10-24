// @flow
/*eslint camelcase: ["error", {allow: ["zoom_level", "tile_row", "tile_column"]}]*/
"use strict";

import Inquirer from "inquirer";
import ColoredString from "./core/ColoredString.js";
import Log from "./core/Log.js";
import Utils from "./core/Utils.js";

class UI {

	static printMetadata(minZoom, maxZoom, format, center, layers) {

		Log.log("");
		Log.title("Vector Tile Info");
		Log.log(
			ColoredString.format(ColoredString.green, "Zoom levels: "),
			ColoredString.format(ColoredString.white, minZoom, maxZoom)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Format: "),
			ColoredString.format(ColoredString.white, format)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Center: "),
			ColoredString.format(ColoredString.white, center)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Layers: ")
		);

		Log.list("", layers);

	}

	static printSummaryTable(vtSummary, tiles, avgTileSizeLimit, avgTileSizeWarning, tileSizeLimit) {
	    const labels = ["Zoom level", "Tiles", "Total level size (KB)", "Average tile size (KB)", "Max tile size (KB)", ""];
	    var columnWidths = labels.map((label)=>label.length);
	    const data = UI.createSummaryTableData(vtSummary, tiles, avgTileSizeLimit, avgTileSizeWarning, tileSizeLimit, columnWidths);

		Log.log("");
		Log.title("Vector Tile Summary");
		Log.table(labels, data);

	}
    static formatDataPoint(value, columnSize, dontRound){
		var rounded = dontRound ? value.toString() : value.toFixed(2);
		var padded  = columnSize ? rounded.padStart(columnSize-1, " ") : rounded;
		return padded;
    };
    static createSummaryTableData(vtSummary, tiles, avgTileSizeLimit, avgTileSizeWarning, tileSizeLimit, columnWidths) {

		const data = [];
		const bigTiles = tiles.reduce((obj, tile) => {

			obj[tile["zoom_level"]] = tile;
			return obj;

		},
			{}
		);

		for (const levelData of vtSummary) {

			const avgTileSizeInKB = levelData.avgTileSize / 1024.0;
			const currentLevel = levelData["zoom_level"];
			const currentBigTile = bigTiles[currentLevel];
			const avgSizeTooBig = (avgTileSizeInKB) > avgTileSizeLimit; // Mapbox recommends an average tile size of 50KB
			const avgSizeAlmostTooBig = (avgTileSizeInKB) > avgTileSizeWarning;
			let levelComment = ColoredString.green("✓");
		    let avgSizeMessage =  UI.formatDataPoint(avgTileSizeInKB, columnWidths[3]);

			if (avgSizeTooBig) {

				levelComment = ColoredString.red("☓ Error: The average tile size of this level exceeds 50KB.");
				avgSizeMessage = ColoredString.red(avgSizeMessage);

			} else if (avgSizeAlmostTooBig) {

				levelComment = ColoredString.yellow("✓ Warning: The average tile size of this level almost exceeds 50KB.");
				avgSizeMessage = ColoredString.yellow(avgSizeMessage);

			}

			if (currentBigTile) {

			    levelComment = `${levelComment} ${ColoredString.red(`Error: A total of ${currentBigTile.num} tiles are bigger than ${tileSizeLimit}KB`)}`;

			}
		    

			data.push([
			    levelData["zoom_level"],
			    levelData.tiles,
			    UI.formatDataPoint(levelData.size / 1024.0, columnWidths[2]),
			    avgSizeMessage,
			    UI.formatDataPoint(levelData.maxSize / 1024.0, columnWidths[4]),
			    levelComment
			]);

		}

		return data;

	}

	static wantMoreInfoQuestion() {

		return new Promise((resolve) => {

			Inquirer.prompt([
				{
					type: "confirm",
					name: "extraInfo",
					message: "Do you want to get more information about a given level?",
					default: false
				}
			]).then(answers => {

				resolve(answers["extraInfo"]);

			});

		});

	}

	static selectLevelPrompt(vtSummary, avgTileSizeLimit, avgTileSizeWarning) {

		const levels = vtSummary.map((elem) =>
			UI.formatLevelElement(elem, avgTileSizeLimit, avgTileSizeWarning)
		);

		return new Promise(resolve => {

			Inquirer.prompt([{
				type: "list",
				name: "zoomLevel",
				message: "Select a level",
				choices: levels
			}]).then(async (answers) => {

				const zoomLevel = parseInt(answers["zoomLevel"].split(" ")[0]);
				resolve(zoomLevel);

			});

		});

	}

	static formatLevelElement(elem, avgTileSizeLimit, avgTileSizeWarning) {

		const avgTileSizeInKB = elem.avgTileSize / 1024.0;
		const avgSizeTooBig = (avgTileSizeInKB) > avgTileSizeLimit; // Mapbox recommends an average tile size of 50KB
		const avgSizeAlmostTooBig = (avgTileSizeInKB) > avgTileSizeWarning;
	    let avgSizeMessage = UI.formatDataPoint(avgTileSizeInKB) + " KB average size";

		if (avgSizeTooBig) {

			avgSizeMessage = ColoredString.red(avgSizeMessage);

		} else if (avgSizeAlmostTooBig) {

			avgSizeMessage = ColoredString.yellow(avgSizeMessage);

		}

		return `${elem["zoom_level"]} (${elem.tiles} tiles - ${avgSizeMessage}) `;

	}

	static showTileDistributionData(data, avgTileSizeLimit, avgTileSizeWarning) {
	    var labels = ["#", "Bucket min (KB)", "Bucket max (KB)", "Nº of tiles", "Running avg size (KB)", "% of tiles in this level", "% of level size", "Accum % of tiles", "Accum % size"];
	    var columnWidths = labels.map((label)=>label.length);
		const dataToPrint = data.map((elem, index) =>
		    UI.formatTileDistributionElement(elem, index, avgTileSizeLimit, avgTileSizeWarning, columnWidths)
		);

		Log.title("Tile size distribution");
		Log.table(labels, dataToPrint);

	}

    static formatTileDistributionElement(elem, index, avgTileSizeLimit, avgTileSizeWarning, columnWidths) {

		const avgTileSizeInKB = elem.runningAvgSize;
		const avgSizeTooBig = (avgTileSizeInKB) > avgTileSizeLimit; // Mapbox recommends an average tile size of 50KB
		const avgSizeAlmostTooBig = (avgTileSizeInKB) > avgTileSizeWarning;
		let avgSizeMessage = UI.formatDataPoint(avgTileSizeInKB, columnWidths[4]);

		if (avgSizeTooBig) {

			avgSizeMessage = ColoredString.red(avgSizeMessage);

		} else if (avgSizeAlmostTooBig) {

			avgSizeMessage = ColoredString.yellow(avgSizeMessage);

		}

	return [index + 1,
			UI.formatDataPoint(elem.minSize,columnWidths[1]),
			UI.formatDataPoint(elem.maxSize,columnWidths[2]),
			UI.formatDataPoint(elem.length, columnWidths[3],false),
			avgSizeMessage,
			UI.formatDataPoint(elem.currentPc,columnWidths[5]),
			UI.formatDataPoint(elem.currentBucketSizePc,columnWidths[6]),
			UI.formatDataPoint(elem.accumPc,columnWidths[7]),
			UI.formatDataPoint(elem.accumBucketSizePc,columnWidths[8]),
	       ];

	}

	static tilesInBucketQuestion() {

		return new Promise(resolve => {

			Inquirer.prompt([
				{
					type: "confirm",
					name: "extraInfo",
					message: "Do you want to see which tiles are in a bucket?",
					default: false
				}
			]).then(answers => {

				resolve(answers["extraInfo"]);

			});

		});

	}

	static selectBucketPrompt(bucketData) {

		const bucketNames = [];
		for (let index = 1; index <= bucketData.length; ++index) {
		    const currBucketData = bucketData[index - 1];

		    var min = UI.formatDataPoint(currBucketData.minSize) +" KB ";
		    var max = UI.formatDataPoint(currBucketData.maxSize) +" KB ";
		
		    bucketNames.push(`${index} ${min} < Size <= ${max} (${currBucketData.length} tiles)`);

		}

		return new Promise(resolve => {

			Inquirer.prompt([{
				type: "list",
				name: "bucket",
				message: "Select a bucket",
				choices: bucketNames
			}]).then((answers) => {

				const bucketIndex = parseInt(answers["bucket"].split(" ")[0]) - 1;
				resolve(bucketIndex);

			});

		});

	}

	static showBucketInfo(bucket, tileSizeLimit) {

		const info = bucket.sort((a, b) => b.size - a.size).map((tile) =>
			UI.formatBucketInfo(tile, tileSizeLimit)
		);

		Log.list("Tiles in this bucket", info);

	}

	static formatBucketInfo(tile, tileSizeLimit) {
	    
	    const size = UI.formatDataPoint(tile.size)+" KB";
		const tileSizeMessage = (tile.size > tileSizeLimit ? ColoredString.red(size) : size);
		const {lon, lat} = Utils.tile2LonLat(tile.zoom_level, tile.tile_row, tile.tile_column);
		return `${tile.zoom_level}/${tile.tile_column}/${tile.tile_row} - ${tileSizeMessage} - LonLat: [${lon}, ${lat}]`;

	}

	static tileInfoQuestion() {

		return new Promise(resolve => {

			Inquirer.prompt([
				{
					type: "confirm",
					name: "extraTileInfo",
					message: "Do you want to get more info about a tile?",
					default: false
				}
			]).then(answers => {

				resolve(answers["extraTileInfo"]);

			});

		});

	}

	static selectTilePrompt(bucket, tileSizeLimit) {

		const tiles = bucket.map((tile) =>
			UI.formatBucketInfo(tile, tileSizeLimit)
		);

		return new Promise(resolve => {

			Inquirer.prompt([{
				type: "list",
				name: "tile",
				message: "Select a tile",
				choices: tiles
			}]).then((answers) => {

				const tileIndex = answers["tile"].split(" ")[0].split("/");
				const tile = {zoom_level: tileIndex[0], tile_column: tileIndex[1], tile_row: tileIndex[2]};
				resolve(tile);

			});

		});

	}

	static showTileInfo(tileData, vectorTileLayers) {

		let totalFeatures = 0;
		let totalVertices = 0;
		let totalKeys = 0;
		let totalValues = 0;

		const layers = tileData.layers.map((layer) => {

			const vtLayer = vectorTileLayers[layer.name];
			layer.layerVertices = vtLayer.features.reduce((accum, feature) => accum + feature.geometry.coordinates.reduce((accum, ring) => (ring.length ? accum + ring.length : feature.geometry.coordinates.length / 2), 0), 0);
			return layer;

		});
		const info = layers.sort((a, b) => b.layerVertices - a.layerVertices).map((layer) => {

			totalFeatures += layer.features.length;
			totalVertices += layer.layerVertices;
			totalKeys += layer.keys.length;
			totalValues += layer.values.length;
			return [layer.name, layer.layerVertices, layer.features.length, layer.keys.length, layer.values.length];

		});

		Log.title("Tile information");
		Log.log(
			ColoredString.format(ColoredString.green, "Layers in this tile: "),
			ColoredString.format(ColoredString.white, info.length)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Features in this tile: "),
			ColoredString.format(ColoredString.white, totalFeatures)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Vertices in this tile: "),
			ColoredString.format(ColoredString.white, totalVertices)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Keys in this tile: "),
			ColoredString.format(ColoredString.white, totalKeys)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Values in this tile: "),
			ColoredString.format(ColoredString.white, totalValues)
		);
		Log.log(
			ColoredString.format(ColoredString.green, "Layers: ")
		);
		Log.table(["Layer name", "# of vertices", "# of features", "# of keys", "# of values"], info);

	}

	static printSlimProcessResults(removedLayers) {

		const messages = [];
		const levels = Object.keys(removedLayers.perLevel);
		for (const level of levels) {

			const numFeatures = removedLayers.perLevel[level];
			messages.push(`Removed ${numFeatures} features in level ${level}`);

		}

		const names = Object.keys(removedLayers.perLayerName).sort();
		for (const name of names) {

			const layerData = removedLayers.perLayerName[name];
			messages.push(`Removed layer ${name} from zoom levels ${Array.from(layerData).sort((a, b) => a - b).join(", ")}`);

		}

		Log.list("Process results", messages);
		if (messages.length === 0) {

			Log.log("Nothing removed");

		}

	}

}

export default UI;
