/**
 * @author tom@0x101.com 
 */
var Config = require("../config.js");

Logger = function(config) {
	this.config = config;
	this.type = Logger.DEFAULT;
};

Logger.DEFAULT = 'console';
Logger.SENTRY = 'sentry';
Logger.instance = [];

Logger.prototype.logError = function(err) {
	console.log([this.getPrefix(), err]);
};

Logger.prototype.logMessage = function(message) {
	console.log(this.getPrefix() + message);
};

Logger.prototype.logQuery = function(queryString) {
	console.log(this.getPrefix() + queryString);
};

Logger.prototype.getPrefix = function() {

	currentTime = new Date()

	var month = currentTime.getMonth() + 1,
		day = currentTime.getDate(),
		year = currentTime.getFullYear(),
		hours = currentTime.getHours(),
		minutes = currentTime.getMinutes(),
		seconds = currentTime.getSeconds();

	if (minutes < 10){
		minutes = "0" + minutes;
	};

	return '[' + day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds +  '] ' ;
};

Logger.get = function(type) {

	if (typeof type === 'undefined') {
		type = this.DEFAULT;
	}

	if (type !== this.DEFAULT) {
		var constants = Config.get('server'),
			type = typeof constants.logger !== 'undefined' ? constants.logger : this.DEFAULT;
	}
	
	if (typeof this.instance[type] === 'undefined') {

		switch(type) {
			case this.DEFAULT:
				this.instance[type] = new Logger();
				break;
			case this.SENTRY:
				var SentryLogger = require("./sentry-logger.js").SentryLogger;
				this.instance[type] = new SentryLogger();
				break;
		}

	}

	return this.instance[type];

};

exports.Logger = Logger;
