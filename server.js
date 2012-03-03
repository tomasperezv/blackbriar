/**
  * @author <tom@0x101.com>
  */

var http = require("http"),
	https = require('https'),
	fs = require('fs'),
	Config = require("./server/config.js"),
	Router = require('./server/router.js');

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
http.createServer(function(request, response) {

	Router.serveRequest(request, response);	

}).listen( serverConf.port );

console.log("HTTP server running at " + serverConf.port + " port.");

/**
 * SSL server
 */
https.createServer(options, function (request, response) {

	Router.serveRequest(request, response);	

}).listen( serverConf.adminPort );

console.log("SSL server running at " + serverConf.adminPort + " port.");
