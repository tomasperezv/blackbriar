/**
  * @author <tom@0x101.com>
  * @class ServerCore
  */

var fs = require('fs'),
	url = require("url"),
	path = require("path"),
	FileTypeFactory = require("../fw/loader/file-type-factory.js").FileTypeFactory,
	FileTypeJavascript = require("../fw/loader/file-type.js").FileTypeJavascript,
	FileTypeCSS = require("../fw/loader/file-type.js").FileTypeCSS,
	FileType = require("../fw/loader/file-type.js").FileType,
	Config = require("./config.js"),
	Handlebars = require('handlebars'),
	TemplateEngine = require('../www/template-engine.js'),
	Router = require('./router.js'),
	Logger = require('./logger/logger').Logger.get();

this.staticCache = [];

this.constants = Config.get('server');
this.allowedExtensions = Config.get('allowed-extensions'); 
this.api = Config.get('api');

this.writeHeader = function(response, filename) {
	var fileTypeFactory = new FileTypeFactory();
	var fileType = fileTypeFactory.getFileType(filename); 
	response.writeHead(fileType.getHTTPCode(), fileType.getHeader());
};

this.staticDomain = function() {
	return this.constants.staticDomain + ':' + this.constants.port;
};

this.apiDomain = function() {
	return this.api.domain + ':' + this.constants.adminPort;
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

this.serveTemplate = function(fileName, config, response, slugInfo) {

	var ServerCore = this;

	var templateName = 'www/' + config['folder'] + config['templates'][0];

	if (this.constants.staticCache && typeof this.staticCache[templateName] !== 'undefined') {

		Logger.logMessage('reading template from cache ' + templateName);
		this.writeHeader(response, templateName);
		var template = Handlebars.compile(this.staticCache[templateName]);

		// Get template data
		var data = TemplateEngine.processData(config, slugInfo);
		var output = template(data);
		response.write(output, "binary");
		response.end();

	} else {
		fs.readFile(templateName, "binary", function(err, template) {
			if (err) {
				Logger.logMessage('Template not found');
			} else {
				Logger.logMessage('serving template ' + templateName);

				ServerCore.staticCache[templateName] = template;
	
				// Get template data
				TemplateEngine.processData(config, slugInfo, function(data) {

					ServerCore.writeHeader(response, templateName);
		
					var template = Handlebars.compile(ServerCore.staticCache[templateName], {noEscape: true});
					var output = template(data);
		
					response.write(output, "binary");
		
					response.end();
				});
			}
		});
	}

};

this.serve = function(fileName, response, slugInfo) {

	var self = this;

	if (this.constants.staticCache && typeof this.staticCache[fileName] !== 'undefined') {
		Logger.logMessage('reading from cache ' + fileName);
		this.writeHeader(response, fileName);
		response.write(this.staticCache[fileName], "binary");
		response.end();
	} else {

		path.exists(fileName, function(exists) {
	
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
	
						Logger.logMessage('Routing request for ' + fileName);
	
						self.writeHeader(response, fileName);
	
						response.write(file, "binary");
						self.staticCache[fileName] = file;
	
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

