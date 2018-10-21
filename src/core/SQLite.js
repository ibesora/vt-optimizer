// @flow
"use strict";

const sqlite3 = require("sqlite3");
const Log = require("./Log");

class SQLite {

	constructor() {

		this.db = null;

	}

	open(fileName) {

		return new Promise((resolve, reject) => {

			this.db = new sqlite3.Database(fileName, (error) => {

				if (error === null) {

					resolve();

				} else {

					Log.error("SQLite::open ", error, "while trying to open the following file:", fileName);
					reject(error);

				}

			});

		});

	}

	get(sql, params) {

		return new Promise((resolve, reject) => {

			this.db.get(sql, params, (error, row) => {

				if (error === null) {

					resolve(row);

				} else {

					Log.error("SQLite::get ", error, "while running the following query:", sql);
					reject(error);

				}

			});

		});

	}

	all(sql, params) {

		return new Promise((resolve, reject) => {

			this.db.all(sql, params, (error, rows) => {

				if (error === null) {

					resolve(rows);

				} else {

					Log.error("SQLite::all ", error, "while running the following query:", sql);
					reject(error);

				}

			});

		});

	}

	run(sql, params) {

		return new Promise((resolve, reject) => {

			this.db.run(sql, params, (error) => {

				if (error === null) {

					resolve();

				} else {

					Log.error("SQLite::run ", error, "while running the following query:", sql);
					reject(error);

				}

			});

		});

	}

	beginTransaction() {

		const self = this;
		return self.run("BEGIN TRANSACTION");

	}

	endTransaction() {

		const self = this;
		return self.run("END TRANSACTION");

	}

}

module.exports = SQLite;
