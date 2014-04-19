var MockRequest = require("./request.js");
this.Request = MockRequest.get();

this.defaultDomain = this.Request.headers.host;
this.apiDomain = 'api.test.com';

this.emptyRequest = MockRequest.get();
this.emptyRequest.headers = {};

this.apiRequest = MockRequest.get();
this.apiRequest.headers.host = this.apiDomain;

this.portRequest = MockRequest.get();
this.portRequest.headers.host = 'test.com:8000';
this.portDomain = 'test.com';

this.reverseProxyRequest = MockRequest.get();
this.reverseProxyRequest.headers.host = 'reverse.com';

// Router with a mocked config
this.get = function() {
	var Router = require("../../server/router.js");

	Router.config.api.domain = this.apiDomain;
	Router.config.server.defaultSection = 'main';

	Router.config.domains = {
		"main": [
			{
				"domain": "main.0x101.com"
			},
			{
				"domain": "blog.0x101.com",
				"slug": true,
				"slugPrefix": "/post/"
			}
		],
		"static": 
		[
			{
				"domain" : "static.0x101.com"
			}
		]
	}; 

	Router.config.reverseProxy = [
		{
			"name": "test",
			"host": "reverse.com",
			"port": 8080
		}
	];

	Router.config.allowedFolders = {
		"main": "",
		"static": ""
	};

	return Router;
};
