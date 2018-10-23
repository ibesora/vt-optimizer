// @flow
"use strict";

const sqlite3 = require("sqlite3");

class SQLite {

	constructor() {

		this.db = null;

	}

	open(fileName) {

		return new Promise((resolve, reject) => {

			this.db = new sqlite3.Database(fileName, sqlite3.OPEN_READWRITE, (error) => {

				if (error === null) {

					resolve();

				} else {

					reject(`SQLite::open ${error.message} while trying to open the following file: ${fileName}`);

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

					reject(`SQLite::get ${error.message} while running the following query: ${sql}`);

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

					reject(`SQLite::all ${error.message} while running the following query: ${sql}`);

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

					reject(`SQLite::run ${error.message} while running the following query: ${sql}`);

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
