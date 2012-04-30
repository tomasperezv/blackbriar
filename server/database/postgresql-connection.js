/**
 * @author tom@0x101.com
 *
 * Object for connecting with a PostgreSQL connection.
 *
 * The database connection info is stored at /config/database.json
 */
var pg = require("pg"),
	DataBaseConnection = require('./database-connection');

PostgreSQLConnection = function(config) {

	DataBaseConnection.DataBaseConnection.call(this);

	// Generate the dsn
	this.dsn = 'tcp://' + config.username + ':' + config.password + '@localhost/' + config.database;
}

PostgreSQLConnection.prototype = new DataBaseConnection.DataBaseConnection(); 

PostgreSQLConnection.prototype.query = function(queryString, onSuccess) {
	pg.connect(this.dsn, function(err, client) {
		if (!err) {
			client.query(queryString, function(err, data) {
				if (!err) {
					onSuccess(data.rows);
				} else {
					console.log(queryString);
					throw err;
				}
			});
		} else {
			throw err;
		}
	});
}

exports.PostgreSQLConnection = PostgreSQLConnection;
