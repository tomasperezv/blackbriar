/**
  * @author <tom@0x101.com>
  */

var http = require("http"),
	https = require('https'),
	fs = require('fs'),
	Config = require("./server/config.js"),
	Router = require('./server/router.js'),
	Logger = require('./server/logger/logger').Logger.get(),
	WebSocketServer = require('websocket').server;

/**
 * Config options
 */
var options = {
	key: fs.readFileSync(Config.get('server', 'sslKey')),
	cert: fs.readFileSync(Config.get('server', 'sslCert'))
};

var serverConf = Config.get('server');

/**
 * HTTP server
 */
var httpServer = http.createServer(function(request, response) {

	Router.serveRequest(request, response);

}).listen( serverConf.port );

Logger.logMessage("HTTP server running at " + serverConf.port + " port.");

/**
 * SSL server
 */
https.createServer(options, function (request, response) {

	Router.serveRequest(request, response);

}).listen( serverConf.adminPort );

Logger.logMessage("SSL server running at " + serverConf.adminPort + " port.");

/**
 * Websockets server
 */
if (serverConf['websockets']) {

	var webSocketsServer = new WebSocketServer({
		httpServer: httpServer,
		autoAcceptConnections: false
	});

	Router.startWebSocket(httpServer, webSocketsServer);

	Logger.logMessage("Websockets support enabled");
}
