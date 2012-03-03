/**
 * @author <tom@0x101.com>
 * @class Loader
 */
var Loader = function() {

		this.fileTypeFactory = null;
		this.onLoad = null;
		this.loadedFiles = 0;

		/**
		 * @author <tom@0x101.com>
		 */
		this.getFileTypeFactory = function() {
				if (!this.fileTypeFactory) {
						this.fileTypeFactory = new FileTypeFactory();
				}
				return this.fileTypeFactory;
		};

		/**
		 * @author <tom@0x101.com>
		 */
		this.checkOnLoad = function() {
				// Call to the on load callback function, defined in the load definition
				// when we already loaded all the pending files.
				this.loadedFiles++;
				if (this.loadedFiles == this.loadDefinition.files.length-1) {
						this.loadDefinition.onLoad();
				}
		}

		/**
		 * @author <tom@0x101.com>
		 */
		this.bindCallback = function(element, callback) {
				var self = this;
				if (element.readyState) {
						element.onreadystatechange = function() {
								if (element.readyState == "loaded" || script.readyState == "complete") {
										element.onreadystatechange = null;
										if (typeof callback != 'undefined') {
												callback();
										}
										self.checkOnLoad();
								}
						};
				} else {
						element.onload = function() {
								if (typeof callback != 'undefined') {
										callback();
								}
								self.checkOnLoad();
						};
				}
		}

		/**
		 * @author <tom@0x101.com>
		 */
		this.load = function(url, callback) {
				try {
						var fileTypeFactory = this.getFileTypeFactory();
						var fileType = fileTypeFactory.getFileType(url);
						var element = fileType.create();
						this.bindCallback(element, callback);
				
						// Inject the script in the head
						document.getElementsByTagName("head")[0].appendChild(element);
				} catch (Error) {
						// The error handling system is not ready yet
				}
		};

		/**
		 * @author <tom@0x101.com>
		 */
		this.run = function(loadDefinition) {

				this.loadDefinition = loadDefinition;

				for (var i = 0; i < loadDefinition.files.length; i++ ) {
						if (typeof loadDefinition.files[i] == "object") {
								this.load(loadDefinition.files[i].url, loadDefinition.files[i].callback);
						} else {
								this.load(loadDefinition.files[i]);
						}
				}
		};
}

