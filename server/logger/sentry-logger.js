/**
 * @author tom@0x101.com 
 */
var Logger = require('./logger').Logger,
	Config = require("../config.js");

SentryLogger = function(config) {
	Logger.call(this);

	this.type = Logger.SENTRY;

	var server = Config.get('server');
	var raven = require('raven');
	this.client = new raven.Client(server.loggerDSN);

	this.client.on('logged', function(){
	});
	
	this.client.on('error', function(error){
		// TODO: Fallback to console logger
		console.log('Logger not available.');
	});

	this.client.patchGlobal();

};

SentryLogger.prototype = new Logger();

SentryLogger.prototype.logError = function(err) {
	client.captureError(err);
	console.log(err);
};

SentryLogger.prototype.logMessage = function(message) {
	this.client.captureMessage(message);
	console.log(message);
};

SentryLogger.prototype.logQuery = function(message) {
	this.client.captureQuery(message, 'mysql');
	console.log(message);
};

exports.SentryLogger = SentryLogger;
