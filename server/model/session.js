/**
 * Object model for the table sessions
 */
var DataBaseModel = require('./database-model');

Session = function() {

	DataBaseModel.DataBaseModel.call(this);
	this.table = 'sessions';

}

Session.prototype = new DataBaseModel.DataBaseModel(); 

/**
 * @author tom@0x101.com
 */
Session.prototype.check = function(userId, session, callback) {

	this.load({user_id: userId, challenge: session}, function(model) {
		callback(model.data.length > 0 ? model.data[0] : {});
	});
	
};

exports.Session = Session;;
