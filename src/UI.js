// @flow
"use strict";

const Inquirer = require("inquirer");
const ColoredString = require("./core/ColoredString");
const Log = require("./core/Log");

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
			ColoredString.format(ColoredString.green, "Layers: "),
			ColoredString.format(ColoredString.white, layers.join(" "))
		);

	}

	static printSummaryTable(vtSummary, tiles, avgTileSizeLimit, avgTileSizeWarning) {

		const data = UI.createSummaryTableData(vtSummary, tiles, avgTileSizeLimit, avgTileSizeWarning);

		Log.log("");
		Log.title("Vector Tile Summary");
		Log.table(["Zoom level", "Tiles", "Total level size (KB)", "Average tile size (KB)", ""], data);

	}

	static createSummaryTableData(vtSummary, tiles, avgTileSizeLimit, avgTileSizeWarning) {

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
			let avgSizeMessage = avgTileSizeInKB;

			if (avgSizeTooBig) {

				levelComment = ColoredString.red("☓ Error: The average tile size of this level exceeds 50KB.");
				avgSizeMessage = ColoredString.red(avgTileSizeInKB);

			} else if (avgSizeAlmostTooBig) {

				levelComment = ColoredString.yellow("✓ Warning: The average tile size of this level almost exceeds 50KB.");
				avgSizeMessage = ColoredString.yellow(avgTileSizeInKB);

			}

			if (currentBigTile) {

				levelComment = `${levelComment} ${ColoredString.red(`Error: A total of ${currentBigTile.num} tiles are bigger than ${VTReader.tileSizeLimit}KB`)}`;

			}

			data.push([
				levelData["zoom_level"],
				levelData.tiles,
				levelData.size / 1024.0,
				avgSizeMessage,
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

	static selectLevelPrompt(vtSummary) {

		const levels = [];
		for (const levelData of vtSummary) {

			levels.push(`${levelData["zoom_level"]} (${levelData.tiles} tiles - ${(levelData.avgTileSize / 1024.0).toFixed(3)} KB average size) `);

		}

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
		
	static showTileDistributionData(data) {

		const dataToPrint = data.map((elem, index) => {
			const newElem = elem.slice();
			newElem.unshift(index+1);
			return newElem;
		});

		Log.title("Tile size distribution")
		Log.table(["#", "Bucket min", "Bucket max", "Nº of tiles", "% of tiles in this level", "Accum %#", "Accum % size"], dataToPrint);

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
		for(let index = 1; index <= bucketData.length; ++index) {

			bucketNames.push(`${index} ${bucketData[index-1][1]} < Size <= ${bucketData[index-1][2]}`);

		}

		return new Promise(resolve => {

			Inquirer.prompt([{
				type: "list",
				name: "bucket",
				message: "Select a bucket",
				choices: bucketNames
			}]).then( (answers) => {

				const bucketIndex = parseInt(answers["bucket"].split(" ")[0]) -1;
				resolve(bucketIndex);
	
			});

		});

	}

	static showBucketInfo(bucket) {

		const info = bucket.map((tile) => `${tile.zoom_level}/${tile.tile_column}/${tile.tile_row}`);
		Log.list("Tiles in this bucket", info);

	}

	static printSlimProcessResults(removedLayers) {

		const messages = [];
		const levels = Object.keys(removedLayers.perLevel);
		for (const level of levels) {

			const numFeatures = removedLayers.perLevel[level];
			messages.push(`Removed ${numFeatures} features in level ${level}`);

		}

		const names = Object.keys(removedLayers.perLayerName);
		for (const name of names) {

			const layerData = removedLayers.perLayerName[name];
			messages.push(`Removed layer ${name} from zoom levels ${Array.from(layerData).sort((a, b) => a - b).join(", ")}`);

		}

		Log.list("Process results", messages);

	}

}

module.exports = UI;
