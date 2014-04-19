/**
  * @author <tom@0x101.com>
  * @class Router
  */
var path = require("path"),
	fs = require('fs'),
	ServerCore = require("./server-core.js"),
	Config = require("./config.js"),
	Api = require("../www/api.js"),
	Logger = require('./logger/logger').Logger.get();

/**
 * Store the needed configuration
 * @var {Object} config
 */
this.config = {
	domains: Config.get('domains'),
	allowedFolders: Config.get('allowed-folders'),
	server: Config.get('server'),
	api: Config.get('api'),
	templates: Config.get('templates'),
	reverseProxy: Config.get('reverse-proxy')
};

/**
 * Dictionary that caches the reverse proxy configuration for request domain.
 * @var {Object} reverseProxyConfig
 */
this.reverseProxyConfig = {};

this.REGEX_DOMAIN = /[a-z0-9.\-]*/i;
this.REGEX_PORT = /:[\d]*/;
this.REGEX_SLUG = /\/([0-9\-a-z]*)\/([0-9\-a-z]*)/i;
this.REGEX_SLUG_SIMPLE = /\/[0-9\-a-z]*\/[0-9\-a-z]*/i;
this.REGEX_SLUG_PREFIX = /^\/[\-a-z0-9]*\//i;

/**
 * @param {Request} request
 * @param {Response} response
 * @method serveRequest
 * @public
 */
this.serveRequest = function(request, response) {

	Logger.logMessage('Request from ' + request.headers['referer'] + ' ' + request.headers['user-agent'] + ' ' + request.connection.remoteAddress);

	if (this.isApiRequest(request)) {
		Logger.logMessage('Api request...');
		Api.serve(request, response);
	} else if (this.isReverseProxyRequest(request)) {
		var config = this.getReverseProxyConfig(request);
		var protocol = request.connection.encrypted ? 'https://' : 'http://';
		var internalTarget = protocol + 'localhost:' + config.port;
		Logger.logMessage('Reverse proxy request to ' + internalTarget + ' ' + config.name);
		var httpProxy = require('http-proxy');
		var proxy = httpProxy.createProxyServer({});
		proxy.web(request, response, {
			target: internalTarget
		});
	} else {

		var filename = this.getFileName(request),
			domain = this.getDomain(request),
			domainInfo = this.parseDomain(domain),
			section = this._getSection(domainInfo),
			templateConfig = this.getTemplateConfig(request, filename, section),
			slugInfo = this.getSlugInfo(request.url, domainInfo);

		if ( templateConfig !== null) {
			ServerCore.serveTemplate(filename, templateConfig, response, slugInfo);
		} else {
			ServerCore.serve(filename, response, slugInfo, this.canServeCompressed(request));
		}
	}
};

/**
 * @param {Request} request
 * @return {Boolean}
 * @method canServeCompressed
 * @public
 */
this.canServeCompressed = function(request) {
	var canServeCompressed = false;
	if (this.config.server['staticCache'] && typeof request.headers['accept-encoding'] !== 'undefined') {
		canServeCompressed = request.headers['accept-encoding'].indexOf('gzip') >= 0;
	}
	return canServeCompressed;
};

/**
 * @param {Request} request
 * @param {String} filename
 * @param {String} section
 * @return {Object} templateConfig
 * @method getTemplateConfig
 * @public
 */
this.getTemplateConfig = function(request, filename, section) {

	var domain = this.getDomain(request),
		domainInfo = this.parseDomain(domain),
		slug = domainInfo != null ? domainInfo.slug : false,
		config = null,
		templatesConfig = this.config.templates,
		sectionPath = filename.split('/');

	sectionPath = sectionPath.length > 2 ? sectionPath[sectionPath.length-2] : '';

	var basename = filename.replace(/^.*[\/\\]/g, '');
	config = this.getBaseTemplateConfig(section, sectionPath, basename);

	if (config === null) {
		// Fallback to check if it's a first level subsection
		config = this.getBaseTemplateConfig(section, sectionPath, '/' + sectionPath + '/index.html', false);
	}

	return config;
};

/**
 * @param {String} filename
 * @param {String} section
 * @return {Object} templateConfig
 * @method getBaseTemplateConfig
 * @public
 */
this.getBaseTemplateConfig = function(section, sectionPath, basename, requireSection) {

	if (typeof requireSection === 'undefined') {
		var requireSection = true;
	}

	var templatesConfig = this.config.templates,
		config = null;

	if (typeof templatesConfig[section] !== 'undefined' && typeof templatesConfig[section][basename] !== 'undefined') {
		if ((requireSection && section === sectionPath) || !requireSection) {
			config = templatesConfig[section][basename];
		}
	}

	return config;
};

/**
 * @param {Request} request
 * @return {Boolean}
 * @method isApiRequest
 * @public
 */
this.isApiRequest = function(request) {
	return this.getDomain(request) === this.config.api.domain;
};

/**
 * @param {Request} request
 * @return {Object|null}
 * @method getReverseProxyConfig
 * @public
 */
this.getReverseProxyConfig = function(request) {

	var domain = this.getDomain(request);
	var reverseProxyConfig = null;

	if (typeof this.reverseProxyConfig[domain] !== 'undefined') {
		reverseProxyConfig = this.reverseProxyConfig[domain];
	} else {
		var config = this.config.reverseProxy;
		for (var i = 0; i < config.length; i++) {
			if (this.getDomain(request) === config[i].host) {
				reverseProxyConfig = config[i];
				// Cache so we don't need to iterate on the configuration again
				this.reverseProxyConfig[domain] = reverseProxyConfig;
				break;
			}
		}
	}

	return reverseProxyConfig;

};

/**
 * @param {Request} request
 * @return {Boolean}
 * @method isReverseProxyRequest
 * @public
 */
this.isReverseProxyRequest = function(request) {
	var isReverseProxy = false;
	if (this.getReverseProxyConfig(request) !== null) {
		isReverseProxy = true;
	}
	return isReverseProxy;
};

/**
 * @param {String} domain
 * @return {Object}
 * @method parseDomain
 * @public
 */
this.parseDomain = function(domain) {
	var result = null;

	for (var section in this.config.domains) {

		var nSubSections = this.config.domains[section].length;

		for (var i = 0; i < nSubSections; i++) {
			if (this.config.domains[section][i].domain == domain) {
				result = {
					section: section,
					slug: typeof this.config.domains[section][i]['slug'] !== 'undefined' ? this.config.domains[section][i]['slug'] : false,
					slugPrefix: typeof this.config.domains[section][i]['slugPrefix'] !== 'undefined' ? this.config.domains[section][i]['slugPrefix'] : ''
				};
				break;
			}
		}

		if (result !== null) {
			break;
		}
	}

	return result;
};

/**
 * Returns the real path of the file that we want to serve, depending on the
 * domains.json file
 * @param {Request} request
 * @method getFileName
 * @public
 */
this.getFileName = function(request) {

	var url = request.url,
		domain = this.getDomain(request),
		port = this.getPort(request),
		domainInfo = this.parseDomain(domain),
		section = this._getSection(domainInfo),
		slug = domainInfo != null ? domainInfo.slug : false;

	if (section == '' || typeof this.config.allowedFolders[section] === 'undefined') {
		// Fix the current section
		section = this.config.server.defaultSection;
		Logger.logMessage('Invalid or default section, fixing to ' + section);
	} else if (slug) {
		// A section with the slug config activated, will follow this
		// pattern: 'blog.0x101.com/post/category/slug'
		// We need to remove here from the url in order to generate the
		// right filename
		url = this._removeSlugPrefix(url, domainInfo, true);
	}

	return this._generateFileName(url, section);
};

/**
 * @param {String} url
 * @param {Object} domainInfo
 * @param {Boolean} removeSlug
 * @return {String} url
 * @method _removeSlugPrefix
 * @private
 */
this._removeSlugPrefix = function(url, domainInfo, removeSlug) {

	if (typeof removeSlug === 'undefined') {
		var removeSlug = false;
	}

	if (domainInfo != null) {
		var searchSlugPrefix = url.match(this.REGEX_SLUG_PREFIX);
		if (searchSlugPrefix != null && searchSlugPrefix.length > 0 && searchSlugPrefix[0] == domainInfo.slugPrefix ) {
			url = '/' + url.replace(this.REGEX_SLUG_PREFIX, '');
			if (removeSlug) {
				url = url.replace(this.REGEX_SLUG_SIMPLE, '');
			}
		}
	}

	return url;
};

/**
 * @param {String} url
 * @param {Object} domainInfo
 * @return {Object}
 * @method getSlugInfo
 * @public
 */
this.getSlugInfo = function(url, domainInfo) {

	url = this._removeSlugPrefix(url, domainInfo);
	var parts = url.match(this.REGEX_SLUG);
	if (parts != null && parts.length > 2) {
		parts = {
			category: parts[1],
			slug: parts[2]
		};
	}

	return parts;
};

/**
 * @param {Request} request
 * @method getDomain
 * @return {String}
 * @public
 */
this.getDomain = function(request) {
	return this._regexDomain(request, this.REGEX_DOMAIN);
};

/**
 * @param {Request} request
 * @method getPort
 * @return {String}
 * @public
 */
this.getPort = function(request) {
	var result = this._regexDomain(request, this.REGEX_PORT),
		port = null;

	if (result !== null && result.length > 0) {
		port = result.substr(1);
	}

	return port;
};

/**
 * @param {Request} request
 * @method devMode
 * @return {Boolean}
 * @public
 */
this.devMode = function(request) {
	return this.config.server.dev;
};

/**
 * Apply websockets support to the httpServer.
 *
 * In order to communicate with the API, the client can send a
 * JSON encoded request, like:
 *
 * {'section': 'geo-twitter', 'action': 'get-tweets', 'params': {param1: '', param2: , ...}}
 *
 * @see https://github.com/Worlize/WebSocket-Node/
 * @param {HttpServer} httpServer
 * @param {WebSocketServer} webSocketServer
 * @method startWebSocket
 * @public
 */
this.startWebSocket = function(httpServer, webSocketServer) {

	var self = this;
	webSocketServer.on('request', function(request) {

		var connection = request.accept('blackbriar-0.1', request.origin);
		connection.on('message', function(message) {
			Logger.logMessage('Websocket connection type ' + message.type);
			if (typeof message.utf8Data !== 'undefined') {
				try {
					var request = JSON.parse(message.utf8Data);
					self._routeWebSocketRequest(request, connection);
				} catch(e) {
					// do nothing
					Logger.logMessage('Unknown type of websocket request');
				}
			}
		});

	});
};

/**
 * @param {Object} webSocketRequest
 * 		webSocketRequest.section {String}
 * 		webSocketRequest.action {String}
 * 		webSocketRequest.params {Object}
 * @method _routeWebSocketRequest
 * @private
 */
this._routeWebSocketRequest = function(webSocketRequest, connection) {
	Logger.logMessage('Routing websocket request');
	Api.serve(webSocketRequest, connection);
};

/**
 * @param {Object} domainInfo
 * @method _getSection
 * @private
 */
this._getSection = function(domainInfo) {
	return domainInfo != null ? domainInfo.section : '';
};

/**
 * @param {Request} request
 * @param {Object} request
 * @return {String}
 * @method _regexDomain
 * @private
 */
this._regexDomain = function(request, regex) {
	var result = null,
		requestUrl = request.headers['host'];
	if( typeof requestUrl !== 'undefined') {

		var extract = requestUrl.match(regex);

		if (extract !== null && extract.length > 0) {
			result = extract[0];
		}
	}
	
	return result;

};

/**
 * @param {String} requestUrl
 * @param {String} currentSection
 * @return {String}
 * @method _generateFileName
 * @private
 */
this._generateFileName = function(requestUrl, currentSection) {
	var filename = path.join(process.cwd(), 'www/' + currentSection);

	filename = path.join(filename, requestUrl);

	// If the file exists, but it's a directory, then add the default file name to the url
	try {
		stats = fs.lstatSync(filename);
		if ( stats.isDirectory() || stats.isSymbolicLink() ) {
			filename += '/' + this.config.server.defaultDocument;
		}
	} catch(e) {
	}

	return filename.replace(/\/\//, '/');
};
