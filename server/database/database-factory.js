/**
 * @author tom@0x101.com 
 */
this.POSTGRE = 'postgresql-connection';
this.SQLITE = 'sqlite-connection';

this.get = function(type) {

	switch(type) {
		default: 
		case this.POSTGRE:
			var Config = require("../config.js"),
				database = require('./' + this.POSTGRE + '.js');
			var connection = new database.PostgreSQLConnection(Config.get('database'));
			break;
		case this.SQLITE:
			var database = require('./' + this.SQLITE + '.js'),
				connection = new database.SQLiteConnection();
			break;
	}

	return connection;
};
