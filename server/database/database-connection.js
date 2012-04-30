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

/**
 * Generic Query operation 
 *
 * @param String querystring
 * @param callback onsuccess
 */
DataBaseConnection.prototype.query = function(querystring, onSuccess) {
};

/**
 * Simple select operation in the DB.
 *
 * @param String queryString
 * @param callback onsuccess
 */
DataBaseConnection.prototype.select = function(queryString, onSuccess) {
	this.query(queryString, onSuccess);
};

/**
 * Executes an insert in the DB.
 *
 * @param String queryString
 * @param Function onSuccess
 */
DataBaseConnection.prototype.insert = function(queryString, onSuccess) {
	this.query(queryString, onSuccess);
};

exports.DataBaseConnection = DataBaseConnection;
