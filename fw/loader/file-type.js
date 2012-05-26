 /**
  * @author <tom@0x101.com>
  * @class FileType
  */
function FileType(url, extraHeaders) {
	this.url = url;
	this.extraHeaders = extraHeaders;
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
	if (this.extraHeaders && typeof this.extraHeaders['compress'] !== 'undefined' && this.extraHeaders['compress']) {
		this.header['Content-Encoding'] = 'gzip';
	}
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
function FileTypeJavascript(url, extraHeaders) {

	FileType.call(this, url, extraHeaders);

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
function FileTypeCSS(url, extraHeaders) {

	FileType.call(this, url, extraHeaders);

	this.elementName = "link";
	this.properties = {
		type: "text/css",
		rel: "stylesheet",
		href: url
	};

	this.header = {"Content-Type": "text/css"};
}

FileTypeCSS.prototype = new FileType();

if (typeof exports !== 'undefined') {
	exports.FileType = FileType;
	exports.FileTypeJavascript = FileTypeJavascript;
	exports.FileTypeCSS = FileTypeCSS;
}

