/**
  * @author <tom@0x101.com>
  * @class Config
  */
var fs = require('fs');

this.loadConfig = function(domain) {

	var config = this;

	// By default try to load the 'development' config file
	var configFileName = this.getFullFileName(domain, true);
	var filename = this.getFullFileName(domain);

	try {
		// We want to merge and override what we defined in the config dev. file	
		var data = JSON.parse(fs.readFileSync(filename, 'utf8'));
		var dataDev = JSON.parse(fs.readFileSync(configFileName, 'utf8'));

		for (var property in dataDev) {
			data[property] = dataDev[property];			
		}

	} catch(e) {
		// Fallback for non dev. file
		var data = JSON.parse(fs.readFileSync(filename, 'utf8'));
	}
	
	config.configDomains[domain] = data; 

};

this.getFullFileName = function(name, dev) {

	if (typeof dev === 'undefined') {
		var dev = false;
	}

	return dev ? this.CONFIGURATION_FOLDER + name + '-dev.json' : 
		this.CONFIGURATION_FOLDER + name + '.json';
};

this.CONFIGURATION_FOLDER = './config/';

this.configDomains = [];

this.domains = ['domains', 'allowed-folders', 'server', 'api', 'allowed-extensions', 'templates'];
var nDomains = this.domains.length;
for (var i = 0; i < nDomains; i++) {
	var currentDomain = this.domains[i];
	this.loadConfig(currentDomain);
}

/**
 * @author tom@0x101.com
 */
this.get = function(domain, property) {

	var value = null;

	if (typeof this.configDomains[domain] !== 'undefined' && typeof this.configDomains[domain][property] !== 'undefined') {
		value = this.configDomains[domain][property];
	} else if (typeof property === 'undefined' && typeof this.configDomains[domain] !== 'undefined') { 
		value = this.configDomains[domain];
	}

	return value;
};

