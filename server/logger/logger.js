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
	console.log(err);
};

Logger.prototype.logMessage = function(message) {
	console.log(message);
};

Logger.prototype.logQuery = function(queryString) {
	console.log(queryString);
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

		console.log('instantiating logger');

		switch(type) {
			case this.DEFAULT:
				this.instance[type] = new Logger();
				break;
			case this.SENTRY:
				var SentryLogger = require("./sentry-logger.js").SentryLogger;
				this.instance[type] = new SentryLogger();
				break;
		}

	} else {
		console.log('using logger instance from cache');
	}

	return this.instance[type];

};

exports.Logger = Logger;
