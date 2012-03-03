/**
 * Object model for the table users
 *
 * create table users(
 * 	id int not null,
 *	login string,
 *	password string,
 * 	permissions int
 * );
 */
var crypto = require('crypto'),
	Salt = require('./salt').Salt,
	DataBaseModel = require('./database-model');

User = function() {

	DataBaseModel.DataBaseModel.call(this);
	this.table = 'users';

}

User.prototype = new DataBaseModel.DataBaseModel(); 

User.prototype.generatePassword = function(password, saltValue) {
	var hash = crypto.createHash('sha512');
	return hash.update(password + saltValue).digest('hex');
};

User.prototype.addUser = function(login, password, callback) {

	var salt = new Salt();

	var saltValue = salt.getRandomString();
	password = this.generatePassword(password, saltValue);

	if (typeof login !== 'undefined' && typeof password !== 'undefined') {
		this.create({login:login, password:password}, function(userId) {
			salt.create({user_id: userId, salt: saltValue}, function() {
				console.log('Created user ' + userId + ' salt: ' + saltValue + ' password: ' + password);
				callback({userId: userId, salt: saltValue});
			});
		});
	} else {
		callback({});
	}

};

User.prototype.getByLogin = function(login, callback) {
	this.load({login: login}, function(results) {
		callback(results.data.length > 0 ? results.data[0] : {});
	});	
};

User.prototype.validate = function(login, password, callback) {

	var self = this;

	this.getByLogin(login, function(user) {
		// Get the salt
		var salt = new Salt();
		salt.load({user_id:user.id}, function(results) {

			var result = {};

			if (results.data.length > 0) {

				var saltValue = results.data[0].salt;

				if (self.generatePassword(password, saltValue) === user.password) {
					result = user;
					console.log('User ' + user.login + ' login OK');
				} else {
					console.log('Invalid password for user ' + user.login);
				}

			}

			callback(result);

		}, 1);
		
	}, 1);
};

exports.User = User;
