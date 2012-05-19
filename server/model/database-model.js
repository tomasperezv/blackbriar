/**
 * @author tom@0x101.com
 *
 * Base object for representing tables in the DB and perform operations with
 * them. 
 *
 * Example: (for a given Post object)
 * 
 * posts.load({id: 1},function(data) {
 * 	console.log(data);
 * });
 * 
 * posts.create({text: 'test'}, function(id) {
 * 	console.log('created blog post: ' + id);
 * })
 */

/*
 * Different strategies for accessing to the DB, can be used here:
 * SQLiteConnection and PostgreSQLConnection, 
 * 
 * 	var DataBaseConnection = require('../database/sqlite-connection');
 * 							 require('../database/postgresql-connection');
 */

// By default selecting the postgre sql connector.
var DataBaseFactory = require('../database/database-factory'),
	Logger = require('../logger/logger').Logger.get('console');

this.databaseType = DataBaseFactory.POSTGRE;

DataBaseModel = function() {

	this.table = '';
	this.lastQuery = '';
	this.data = [];

};

/**
 * Return the contents of the last query executed in the DB as an array of
 * objects. (Each element of the array is a row)
 * @return Array
 */
DataBaseModel.prototype.getData = function() {
	var data = [];

	if (this.data.length > 0) {
		data = this.data[0];
	}

	return data;
};

/**
 * Performs a load from the DB depending on the filters that we specify.
 * 
 * Example:
 *
 * posts.load({id: 2},function(data) {
 * 	console.log(data);
 * });
 *
 * @param Array filters 
 * @param Function onSuccess
 * @param Integer maxItems 
 */
DataBaseModel.prototype.load = function(filters, onSuccess, maxItems, orderBy, offset) {

	if (typeof filters === 'undefined') {
		var filters = {};
	}
	
	this.lastQuery = this.getLoadQuery(filters, maxItems, orderBy, offset);

	Logger.logQuery(this.lastQuery);

	var dataBaseConnection = DataBaseFactory.get(this.databaseType);  

	var model = this;

	dataBaseConnection.select(this.lastQuery, function(rows) {
		model.data = rows;
		onSuccess(model);
	});
};

/**
 * @author tom@0x101.com
 */
DataBaseModel.prototype.createAndLoad = function(data, onSuccess) {

	var self = this;
	this.create(data, function(id) {

		self.lastQuery = self.getLoadQuery({id: id}, 1);
	
		var dataBaseConnection = DataBaseFactory.get(this.databaseType);  
	
		dataBaseConnection.select(self.lastQuery, function(rows) {
			onSuccess(rows.length > 0 ? rows[0] : {});
		});

	});
};

/**
 * Add a new register in the DB:
 *
 * posts.create({text: 'test'}, function(id) {
 * 	console.log('created: ' + id);
 * })
 *
 * It passes the id of the row created to the callback.
 *
 * @param Object data
 * @param Function onSuccess
 */
DataBaseModel.prototype.create = function(data, onSuccess) {

	this.lastQuery = this.getInsertQuery(data);

	var dataBaseConnection = DataBaseFactory.get(this.databaseType);  
	dataBaseConnection.insert(this.lastQuery, function(result) {
		onSuccess(result[0].id);
	});
};

DataBaseModel.prototype.update = function(data, onSuccess) {

	this.lastQuery = this.getUpdateQuery(data);

	Logger.logQuery(this.lastQuery);

	var dataBaseConnection = DataBaseFactory.get(this.databaseType);  
	dataBaseConnection.insert(this.lastQuery, function() {
		onSuccess(data);
	});
};

DataBaseModel.prototype.remove = function(data, onSuccess) {
	this.lastQuery = this.getRemoveQuery(data);
	Logger.logQuery(this.lastQuery);

	var dataBaseConnection = DataBaseFactory.get(this.databaseType);  
	dataBaseConnection.select(this.lastQuery, function() {
		onSuccess(data.id);
	});
};

DataBaseModel.prototype.count = function(filters, onSuccess) {
	this.lastQuery = this.getCountQuery(filters);
	Logger.logQuery(this.lastQuery);

	var dataBaseConnection = DataBaseFactory.get(this.databaseType);  
	dataBaseConnection.select(this.lastQuery, function(rows) {
		var count = rows.length > 0 ? rows[0].count : 0;
		onSuccess(count);
	});
}

/**
 * Builds an insert query.
 *
 * @param Object data 
 * @return String
 */
DataBaseModel.prototype.getInsertQuery = function(data) {

	var numFields = Object.keys(data).length;

	var query = 'INSERT INTO ' + this.table;

	query += '(id, ';
	var currentPosition = 0;
	for (fieldName in data) {
		query += fieldName;

		currentPosition++;

		if (currentPosition < numFields) {
			query += ',';
		}
	}

	query += ')';

	query += ' VALUES(DEFAULT, ';

	currentPosition = 0;

	for (fieldName in data) {

		var value = data[fieldName];

		if (typeof value === 'string') {
			query += '\'' + value + '\'';
		} else {
			query += value;
		}

		currentPosition++;

		if (currentPosition < numFields) {
			query += ',';
		}
	}
	
	query += ') RETURNING id;';

	return query;	
};

DataBaseModel.prototype.getRemoveQuery = function(data) {
	return query = 'DELETE FROM ' + this.table + ' WHERE id = ' + data.id;
};

DataBaseModel.prototype.getUpdateQuery = function(data) {

	var numFields = Object.keys(data).length;

	var query = 'UPDATE ' + this.table;

	query += ' SET ';
	var currentPosition = 0;
	for (fieldName in data) {

		var value = data[fieldName];

		query += fieldName + ' = ';

		if (typeof value === 'string') {
			query += '\'' + value + '\'';
		} else {
			query += value;
		}

		currentPosition++;

		if (currentPosition < numFields) {
			query += ',';
		}
	}

	query += ' WHERE id = ' + data.id;

	query += ';';

	return query;	
};

/**
 * Builds a simple SELECT query.
 *
 * @param Object filters 
 * @param Integer maxItems 
 */
DataBaseModel.prototype.getLoadQuery = function(filters, maxItems, orderBy, offset) {

	var query = 'SELECT * FROM ' + this.table + ' WHERE ',
		query = this._applyFilters(query, filters);

	if (typeof orderBy !== 'undefined') {
		query += ' ORDER BY ' + orderBy.column + " " + orderBy.type;
	}

	if (typeof maxItems !== 'undefined') {
		query += ' LIMIT ' + maxItems;
	}

	if (typeof offset !== 'undefined') {
		query += ' OFFSET ' + offset;
	}

	query += ';';

	return query;
};

/**
 * Extend a query adding information about field filters.
 */
DataBaseModel.prototype._applyFilters = function(query, filters) {

	if (Object.keys(filters).length === 0) {
		query += 'TRUE';
	} else {

		var first = true;
		
		for (fieldName in filters) {
			
			if (filters[fieldName] != undefined) {
				if (!first) {
					query += ' AND ';
				}
	
				query += fieldName + ' = ' + "'" + filters[fieldName] + "'";	
	
				first = false;
			}

		}

		if (first) {
			// No valid filters applied
			query += 'TRUE';
		}

	}

	return query;
};

/**
 * Count the number of rows in a table
 */
DataBaseModel.prototype.getCountQuery = function(filters) {
	var query = 'SELECT COUNT(*) FROM ' + this.table + ' WHERE ',
		query = this._applyFilters(query, filters);

	query += ';';
	return query;
};

DataBaseModel.prototype.getRandomString = function() {

	var chars, rand, i, salt, bits;
  
	chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; 
	salt = '';
	bits = 512;
	
	// In v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
	while (bits > 0) {
		rand = Math.floor(Math.random() * 0x100000000); 

		for (i = 26; i > 0 && bits > 0; i -= 6, bits -= 6) {
			salt += chars[0x3F & rand >>> i];
		}
	}
	
	return salt;
};

DataBaseModel.prototype.getTimestamp = function() {
	return Math.round((new Date()).getTime() / 1000);
};

DataBaseModel.prototype.formatDate = function(timestamp) {
	var date = new Date(timestamp*1000),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		seconds = date.getSeconds(),
		day = date.getDay() + 1,
		month = date.getMonth() + 1,
		year = date.getFullYear();
	return day + '/' + month + '/' + year + ' ' + (hours.length > 1 ? hours : '0' + hours) + ':' + (minutes.length > 1 ? minutes : '0' + minutes) + ':' + (seconds.length > 1 ? seconds : '0' + seconds);
};

DataBaseModel.prototype.formatDateRFC822 = function(timestamp) {

	if (typeof timestamp === 'undefined') {
		var timestamp = new Date().getTime();
	} else {
		timestamp *=1000;
	}

	var date = new Date(timestamp),
		day = date.getDay(),
		hours = date.getHours(),
		minutes = date.getMinutes(),
		seconds = date.getSeconds(),
		day = date.getDay(),
		month = date.getMonth(),
		year = date.getFullYear();

	var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	return weekdays[day] + ', ' + (day > 9 ? day : '0' + day) + ' ' + months[month] + ' ' + year + ' ' + (hours > 9 ? hours : '0' + hours) + ':' + (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds) + ' +0000';
	
};

exports.DataBaseModel = DataBaseModel;
