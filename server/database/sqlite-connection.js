/**
 * @author tom@0x101.com
 *
 * Object for connecting with a sql lite database.
 *
 * The database is located in the folder '../database/0x101.db'
 */
var sqlite = require("sqlite3");

var DataBaseConnection = require('./database-connection');

SQLiteConnection = function(config) {

	DataBaseConnection.DataBaseConnection.call(this);

	this.configuration.filename = './database-setup/0x101.db';

	// Connect to the Database
	this.dsn = new sqlite.Database(this.configuration.filename);
}

SQLiteConnection.prototype = new DataBaseConnection.DataBaseConnection(); 

/**
 * Simple select operation in the DB.
 *
 * @param String querystring
 * @param callback onsuccess
 */
SQLiteConnection.prototype.select = function(querystring, onsuccess) {

	this.dsn.all(querystring, function(error, rows) {

		if (error) {
			throw error;
		}

		onsuccess(rows);
	});

};

/**
 * Executes an insert in the DB.
 *
 * @param String queryString
 * @param Function onSuccess
 */
SQLiteConnection.prototype.insert = function(queryString, onSuccess) {

	console.log(queryString);
	this.dsn.prepare(queryString);
	this.dsn.run(queryString);
	onSuccess();

};

exports.SQLiteConnection = SQLiteConnection;
