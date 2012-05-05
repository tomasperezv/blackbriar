var Request = function() {
	this.headers = {
		'host': 'default.test.com'
	};

	this.url = '';

	this.setDomain = function(domain) {
		this.headers.host = domain;
	};

	this.setUrl = function(url) {
		this.url = url;
	};

};

this.get = function() {
	return new Request();
}
