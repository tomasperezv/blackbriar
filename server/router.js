/**
  * @author <tom@0x101.com>
  * @class Router
  */
var	path = require("path"),
	fs = require('fs'),
	ServerCore = require("./server-core.js"),
	Config = require("./config.js"),
	Api = require("../www/api.js"),
	Logger = require('./logger/logger').Logger.get();

this.config = {
	domains: Config.get('domains'),
	allowedFolders: Config.get('allowed-folders'),
	server: Config.get('server'),
	api: Config.get('api'),
	templates: Config.get('templates')
}

this.REGEX_DOMAIN = /[a-z0-9.\-]*/i;
this.REGEX_PORT = /:[\d]*/;
this.REGEX_SLUG = /\/([0-9\-a-z]*)\/([0-9\-a-z]*)/i;
this.REGEX_SLUG_SIMPLE = /\/[0-9\-a-z]*\/[0-9\-a-z]*/i;
this.REGEX_SLUG_PREFIX = /^\/[\-a-z0-9]*\//i;

/**
 * @author tom@0x101.com
 */
this.serveRequest = function(request, response) {

	if (this.isApiRequest(request)) {

		Logger.logMessage('Api request...');
		Api.serve(request, response);

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

this.canServeCompressed = function(request) {
	var canServeCompressed = false;
	if (this.config.server['staticCache'] && typeof request.headers['accept-encoding'] !== 'undefined') {
		canServeCompressed = request.headers['accept-encoding'].indexOf('gzip') >= 0;
	}
	return canServeCompressed;
};

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

this.isApiRequest = function(request) {
	return this.getDomain(request) === this.config.api.domain;
};

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

this.getDomain = function(request) {
	return this._regexDomain(request, this.REGEX_DOMAIN);
};

this.getPort = function(request) {
	var result = this._regexDomain(request, this.REGEX_PORT),
		port = null;

	if (result !== null && result.length > 0) {
		port = result.substr(1);
	}

	return port;
};

this.devMode = function(request) {
	return this.config.server.dev;
};

this._getSection = function(domainInfo) {
	return domainInfo != null ? domainInfo.section : '';
};

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
