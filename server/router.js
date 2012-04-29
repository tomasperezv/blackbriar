/**
  * @author <tom@0x101.com>
  * @class Router
  */
var	path = require("path"),
	fs = require('fs'),
	ServerCore = require("./server-core.js"),
	Config = require("./config.js"),
	Api = require("../www/api.js");

this.config = {
	domains: Config.get('domains'),
	allowedFolders: Config.get('allowed-folders'),
	server: Config.get('server'),
	api: Config.get('api'),
	templates: Config.get('templates')
}

/**
 * @author tom@0x101.com
 */
this.serveRequest = function(request, response) {

	if (this.isApiRequest(request)) {

		console.log('Api request...');
		Api.serve(request, response);

	} else {

		var filename = this.getFileName(request),
		domain = this.getDomain(request),
		currentSection = this.getCurrentSection(domain),
		templateConfig = this.getTemplateConfig(filename, currentSection);

		console.log([filename, domain, currentSection, templateConfig]);

		if ( templateConfig !== null) {
			ServerCore.serveTemplate(filename, templateConfig, response);
		} else {
			ServerCore.serve(filename, response);
		}
	}
};

this.getTemplateConfig = function(filename, section) {
	var config = null;

	var templatesConfig = this.config.templates;

	var sectionPath = filename.split('/');
	sectionPath = sectionPath.length > 2 ? sectionPath[sectionPath.length-2] : '';

	var basename = filename.replace(/^.*[\/\\]/g, '');
	config = this.getBaseTemplateConfig(section, sectionPath, basename);

	if (config === null) {
		// Fallback to check if it's a first level subsection
		config = this.getBaseTemplateConfig(section, sectionPath, '/' + sectionPath + '/index.html', false);
	}

	return config;
};

this.getBaseTemplateConfig = function(section, sectionPath, basename, requireSection) {

	if (typeof requireSection === 'undefined') {
		var requireSection = true;
	}

	var templatesConfig = this.config.templates;

	var config = null;
	if (typeof templatesConfig[section] !== 'undefined' && typeof templatesConfig[section][basename] !== 'undefined') {
		if ((requireSection && section === sectionPath) || !requireSection) {
			config = templatesConfig[section][basename];
		}
	}

	return config;
};

this.isApiRequest = function(request) {
	return this.getDomain(request) === this.config.api.domain;
};

this.getCurrentSection = function(domain) {

	var currentSection = '';

	// TODO: Optimize the loop, the info should be stored in a more optimal 
	// data structure

	// TODO: Also add support for the path
	for (var section in this.config.domains) {

		var nSubSections = this.config.domains[section].length;

		for (var i = 0; i < nSubSections; i++) {
			if (this.config.domains[section][i].domain == domain) {
				currentSection = section;
				break;
			}
		}

		if (currentSection !== '') {
			break;
		}
	}

	return currentSection;
};

this.generateFileName = function(requestUrl, currentSection) {
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

	return filename;
};

/**
 * Returns the real path of the file that we want to serve, depending on the
 * domains-conf.json file
 */
this.getFileName = function(request) {

	var requestUrl = request.headers['host'];

	var domain = this.getDomain(request);
	var port = this.getPort(requestUrl);

	var url = (request.url == '/' ? ServerCore.constants.DEFAULT_DOCUMENT : request.url);

	var currentSection = this.getCurrentSection(domain);

	if (currentSection == '' || typeof this.config.allowedFolders[currentSection] === 'undefined') {
		// Fix the current section
		currentSection = this.config.server.defaultSection;
		console.log('Invalid or default section, fixing to ' + currentSection);
	}

	var filename = this.generateFileName(url, currentSection);

	return filename;
};

this.getDomain = function(request) {

	var requestUrl = request.headers['host'];
	
	var domain = null;

	var result = requestUrl.match(/[^:0-9]*/);

	if (result.length > 0) {
		domain = result[0];
	}

	return domain;
	
};

this.getPort = function(host) {

	var port = null;
	var result = host.match(/:[0-9]*/);

	if (result !== null && result.length > 0) {
		port = result[0].replace(/:/, '');
	}

	return port;
};

/**
 * TODO: Improve security
 * @author tom@0x101.com 
 */
this.isAdmin = function(request) {
	return request.connection.remoteAddress === '127.0.0.1';
};

this.devMode = function(request) {
	return this.config.server.dev;
};
