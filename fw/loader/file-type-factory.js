 /**
  * @author <tom@0x101.com>
  * @class FileTypeFactory
  */
var FileTypeJavascript = require("./file-type.js").FileTypeJavascript,
FileTypeCSS = require("./file-type.js").FileTypeCSS,
FileType = require("./file-type.js").FileType;

var FileTypeFactory = function() { 

	/**
	 * constants 
	 */
	this.JAVASCRIPT = 'js';
	this.CSS = 'css';

	/**
	 * @author <tom@0x101.com>
	 */
	this.getFileType = function(filename, extraHeaders) {

		var fileType = null;

		switch (filename.split('.').pop().toLowerCase()) {
			case this.JAVASCRIPT: {
				fileType = new FileTypeJavascript(filename, extraHeaders);
				break;
			}
			case this.CSS: {
				fileType = new FileTypeCSS(filename, extraHeaders);
				break;
			}
			default: {
				fileType = new FileType(filename, extraHeaders);
				break;
			}
		}

		return fileType;

	};
}

if (typeof exports !== 'undefined') {
	exports.FileTypeFactory = FileTypeFactory;
}
