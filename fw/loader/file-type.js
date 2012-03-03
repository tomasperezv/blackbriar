 /**
  * @author <tom@0x101.com>
  * @class FileType
  */
function FileType(url) {
	this.url = url;
	this.properties = {};
	this.header = {};
	this.HTTPCode = 200;
}

FileType.prototype.getUrl = function() {
	return this.url;
};

FileType.prototype.getHTTPCode = function() {
	return this.HTTPCode;
}

FileType.prototype.getHeader = function() {
	return this.header;
}

FileType.prototype.create = function() {

	var element = document.createElement(this.elementName);

	// Set the properties of the element
	for (propertyName in this.properties) {
		element[propertyName] = this.properties[propertyName];
	}

	return element;
}

/**
 * @author <tom@0x101.com>
 * @class FileTypeJavascript
 */
function FileTypeJavascript(url) {

	FileType.call(this, url);

	this.elementName = "script";
	this.properties = {
		type: "text/javascript",
		src: url
	};

	this.header = {"Content-Type": "application/x-javascript"};
}

FileTypeJavascript.prototype = new FileType();

/**
 * @author <tom@0x101.com>
 * @class FileTypeCSS
 */
function FileTypeCSS(url) {

	FileType.call(this, url);

	this.elementName = "link";
	this.properties = {
		type: "text/css",
		rel: "stylesheet",
		href: url
	};
}

FileTypeCSS.prototype = new FileType();

if (typeof exports !== 'undefined') {
	exports.FileType = FileType;
	exports.FileTypeJavascript = FileTypeJavascript;
	exports.FileTypeCSS = FileTypeCSS;
}

