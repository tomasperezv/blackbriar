/**
  * @author <tom@0x101.com>
  * @class ServerCore
  */

var fs = require('fs'),
	url = require("url"),
	gzip = require('compress'),
	FileTypeFactory = require("../fw/loader/file-type-factory.js").FileTypeFactory,
	FileTypeJavascript = require("../fw/loader/file-type.js").FileTypeJavascript,
	FileTypeCSS = require("../fw/loader/file-type.js").FileTypeCSS,
	FileType = require("../fw/loader/file-type.js").FileType,
	Config = require("./config.js"),
	Handlebars = require('handlebars'),
	Controller = require('../www/controller.js'),
	Router = require('./router.js'),
	Logger = require('./logger/logger').Logger.get();

this.staticCache = [];

this.constants = Config.get('server');
this.allowedExtensions = Config.get('allowed-extensions'); 
this.api = Config.get('api');

this.writeHeader = function(response, filename, compress) {
	var fileTypeFactory = new FileTypeFactory(),
		extraHeaders = this.constants.staticCache ? {compress:compress} : {},
		fileType = fileTypeFactory.getFileType(filename, extraHeaders); 
	response.writeHead(fileType.getHTTPCode(), fileType.getHeader());
};

this.staticDomain = function() {
	var result = this.constants.staticDomain;

	if (this.constants.port != '80') {
		result += ':' + this.constants.port;
	}

	return result;
};

this.apiDomain = function(secure) {
	if (typeof secure === 'undefined') {
		secure = false;
	}

	var result = this.api.domain,
		port = (secure ? this.constants.adminPort : this.constants.port);

	if (port != '80') {
		result += ':' + port;
	}

	return result;
};

this.writeError = function(response, errorCode, err) {

	if (typeof err === 'undefined') {
		err = {};
	}

	var fileType = new FileType();
	var content = '';

	switch(errorCode) {
		case this.constants.notFound: {
			content = "not found";
			break;
		}
		case this.constants.forbidden: {
			content = "forbidden";
			break;
		}
		default:
		case this.constants.serverError: {
			content = err + " " + errorCode  + "\n" + JSON.stringify(err);
		}
	}

	response.writeHead(errorCode, fileType.getHeader());
	response.write(content);
};

this.writeTemplateResponse = function(response, templateContent, requestData) {
	var self = this;

	// Get template data
	Controller.processData(requestData.config, requestData.slugInfo, function(data) {

		self.writeHeader(response, requestData.templateName);

		var template = Handlebars.compile(templateContent, {noEscape: true}),
			output = template(data);

		response.write(output, "utf-8");

		response.end();
	});
};

this.serveTemplate = function(fileName, config, response, slugInfo) {

	var self = this,
		templateName = 'www/' + config['folder'] + config['templates'][0];

	if (this.constants.staticCache && typeof this.staticCache[templateName] !== 'undefined') {
		Logger.logMessage('reading template from cache ' + templateName);
		// Get template data
		this.writeTemplateResponse(response, 
		this.staticCache[templateName],
		{ config: config, templateName: templateName, slugInfo: slugInfo});

	} else {
		// We need to read the template from the filesystem
		fs.readFile(templateName, "binary", function(err, templateContent) {
			if (err) {
				Logger.logMessage('Template not found');
			} else {
				Logger.logMessage('serving template ' + templateName);

				if (self.constants.staticCache) {
					// Store the template in the cache
					self.staticCache[templateName] = templateContent;
				}

				self.writeTemplateResponse(response, templateContent,
				{ config: config, templateName: templateName, slugInfo: slugInfo});
			}
		});
	}
};

this.writeStatic = function(response, content, fileName, compress) {
	this.writeHeader(response, fileName, compress);
	response.write(content, "binary");
	response.end();
};

this.serve = function(fileName, response, slugInfo, compress) {

	var self = this;

	if (typeof compress === 'undefined') {
		var compress = false;
	}

	var cacheKey = compress ? fileName + '.gzip' : fileName;

	if (this.constants.staticCache && typeof this.staticCache[cacheKey] !== 'undefined') {
		Logger.logMessage('reading from cache ' + fileName);
		this.writeStatic(response, this.staticCache[cacheKey], fileName, compress);
	} else {

		fs.exists(fileName, function(exists) {
	
			if(!exists) {
				self.writeError(response, self.constants.notFound);
				response.end();
				return;
			}
				
			fs.readFile(fileName, "binary", function(err, file) {
		
				if(err) {
		
					self.writeError(response, self.constants.serverError, err);
		
				} else if ( self.canServe(fileName) ) {
	
					try {
						Logger.logMessage('Routing request for ' + fileName + ', compress=' + compress);
						// If the cache is enabled, store the file there.
						if (self.constants.staticCache) {
							if (compress) {
								// Compress the content if needed
								var compressor = new gzip.Gzip();
								compressor.init();
								file = compressor.deflate(file, 'binary'); 
								file += compressor.end();
							}
							self.staticCache[cacheKey] = file;
						}

						self.writeStatic(response, file, fileName, compress);
	
					} catch (Error) {
						Logger.logError(Error);
						self.writeHeader(response, self.constants.defaultDocument);
						response.write(file, "binary");
					}
		
				} else {
					Logger.logMessage('Trying to access to forbidden extension: ' + fileName);
					self.writeError(response, self.constants.forbidden);
				}
		
				response.end();
		
			});
		});
	}

};

/**
 * Determine if we can serve the filename, checking whether the extension is included
 * in the allowed-extensions.json.
 *
 * @author tom@0x101.com
 */
this.canServe = function(filename) {

	var extension = filename.split('.').pop().toLowerCase()

	return filename.length > 0 && typeof this.allowedExtensions[extension] !== 'undefined';
};

