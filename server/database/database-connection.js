/**
 * Basic object for representing a communication with a DB. Right now only the
 * SQLite connection is extending from it, but other connection could be
 * implemented.
 *
 * @author tom@0x101.com 
 */
DataBaseConnection = function(config) {

	/**
	 * @var Object config  
	 *
	 * This properties are initialized in the child classes. 
	 */
	this.configuration = {
		hostname: '',
		user: '',
		password: '',
		database:''
	};

	this.dsn = null;

	// Override custom properties
	if (typeof config !== 'undefined') {
		for (customProperty in config) {
			if (this.configuration.hasOwnProperty(customProperty)) {
				this.configuration[customProperty] = config[customProperty];
			}
		}
	}
}

DataBaseConnection.prototype.query = function() {
};

exports.DataBaseConnection = DataBaseConnection;
