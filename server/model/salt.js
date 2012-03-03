/**
 * Object model for the table salts
 *
 * create table salts(
 * 	id int not null,
 *	user_id int not null,	
 *	salt string
 * );
 */
var crypto = require('crypto'),
	DataBaseModel = require('./database-model');

Salt = function() {

	DataBaseModel.DataBaseModel.call(this);
	this.table = 'salts';

}

Salt.prototype = new DataBaseModel.DataBaseModel(); 

exports.Salt = Salt;
