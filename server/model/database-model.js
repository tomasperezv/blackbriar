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
var SQLiteConnection = require('../database/sqlite-connection');

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
DataBaseModel.prototype.load = function(filters, onSuccess, maxItems) {

	if (typeof filters === 'undefined') {
		var filters = {};
	}
	
	this.lastQuery = this.getLoadQuery(filters, maxItems);

	console.log(this.lastQuery);

	var sqliteConnection = new SQLiteConnection.SQLiteConnection(); 

	var model = this;

	sqliteConnection.select(this.lastQuery, function(rows) {
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
	
		var sqliteConnection = new SQLiteConnection.SQLiteConnection(); 
	
		sqliteConnection.select(self.lastQuery, function(rows) {
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

	var sqliteConnection = new SQLiteConnection.SQLiteConnection(); 
	sqliteConnection.insert(this.lastQuery, function() {
		sqliteConnection.select('SELECT last_insert_rowid() as last_id;', function(row) {
			if (row.length > 0) {
				onSuccess(row[0]['last_id']);
			}
		});
	});
};

DataBaseModel.prototype.update = function(data, onSuccess) {

	this.lastQuery = this.getUpdateQuery(data);
	console.log(this.lastQuery);

	var sqliteConnection = new SQLiteConnection.SQLiteConnection(); 
	sqliteConnection.insert(this.lastQuery, function() {
		onSuccess(data);
	});
};

DataBaseModel.prototype.remove = function(data, onSuccess) {
	this.lastQuery = this.getRemoveQuery(data);
	console.log(this.lastQuery);

	var sqliteConnection = new SQLiteConnection.SQLiteConnection(); 
	sqliteConnection.select(this.lastQuery, function() {
		onSuccess(data.id);
	});
};

/**
 * Builds an insert query.
 *
 * @param Object data 
 * @return String
 */
DataBaseModel.prototype.getInsertQuery = function(data) {

	var numFields = Object.keys(data).length;

	var query = 'INSERT INTO ' + this.table;

	query += '(';
	var currentPosition = 0;
	for (fieldName in data) {
		query += fieldName;

		currentPosition++;

		if (currentPosition < numFields) {
			query += ',';
		}
	}

	query += ')';

	query += ' VALUES(';

	currentPosition = 0;

	for (fieldName in data) {

		var value = data[fieldName];

		if (typeof value === 'string') {
			query += '"' + value + '"';
		} else {
			query += value;
		}

		currentPosition++;

		if (currentPosition < numFields) {
			query += ',';
		}
	}
	
	query += ');';

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
			query += '"' + value + '"';
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
DataBaseModel.prototype.getLoadQuery = function(filters, maxItems, orderBy) {

	var query = 'SELECT * FROM ' + this.table + ' WHERE ';

	if (Object.keys(filters).length === 0) {
		query += '1';
	} else {

		var first = true;
		
		for (fieldName in filters) {

			if (!first) {
				query += ' AND ';
			}

			query += fieldName + ' = ' + "'" + filters[fieldName] + "'";	

			first = false;
		}
	}

	if (typeof maxItems !== 'undefined') {
		query += ' LIMIT ' + maxItems;
	}

	if (typeof orderBy !== 'undefined') {
		query += 'ORDER BY ' + "'" + orderBy.column + "' " + orderBy.type;
	}

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

exports.DataBaseModel = DataBaseModel;
