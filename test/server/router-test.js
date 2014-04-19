var mock = require('../mock/router.js'),
	Router = require('../mock/router.js').get();
	Request = require("../mock/request.js");

exports['isApiRequest'] = function (test) {

	test.strictEqual(Router.isApiRequest(mock.Request), false);
	test.strictEqual(Router.isApiRequest(mock.apiRequest), true);
	test.strictEqual(Router.isApiRequest(mock.emptyRequest), false);

	test.done();
};

exports['isReverseProxyRequest'] = function (test) {

	test.strictEqual(Router.isReverseProxyRequest(mock.Request), false);
	test.strictEqual(Router.isReverseProxyRequest(mock.apiRequest), false);
	test.strictEqual(Router.isReverseProxyRequest(mock.emptyRequest), false);
	test.strictEqual(Router.isReverseProxyRequest(mock.reverseProxyRequest), true);

	test.done();
};

exports['getDomain'] = function(test) {

	test.equal(Router.getDomain(mock.Request), mock.defaultDomain);
	test.equal(Router.getDomain(mock.apiRequest), mock.apiDomain);
	test.strictEqual(Router.getDomain(mock.emptyRequest), null);
	test.equal(Router.getDomain(mock.portRequest), mock.portDomain);

	var request = Request.get();
	request.setDomain('www.0x101.com');
	test.equal(Router.getDomain(request), 'www.0x101.com');

	test.done();
};

exports['getPort'] = function(test) {

	test.strictEqual(Router.getPort(mock.portRequest), '8000');
	test.strictEqual(Router.getPort(mock.emptyRequest), null);
	test.strictEqual(Router.getPort(mock.Request), null);

	test.done();
};

exports['parseDomain'] = function(test) {

	test.strictEqual(Router.parseDomain('invalid.0x101.com'), null);
	test.strictEqual(Router.parseDomain(null), null);
	test.deepEqual(Router.parseDomain('main.0x101.com'), {section: 'main', slug: false, slugPrefix: ''});
	test.deepEqual(Router.parseDomain('blog.0x101.com'), {section: 'main', slug: true, slugPrefix: '/post/'});
	test.deepEqual(Router.parseDomain('static.0x101.com'), {section:'static', slug: false , slugPrefix: ''});

	test.done();
};


exports['getSlugInfo'] = function(test) {
	test.deepEqual(Router.getSlugInfo('/category/slug/'), {category: 'category', slug: 'slug'});
	test.deepEqual(Router.getSlugInfo('/category/slug/index.html'), {category: 'category', slug: 'slug'});
	test.done();
};

exports['getFileName'] = function(test) {

	var request = Request.get();

	// Mock generateFileName
	Router._generateFileName = function(url, currentSection) {
		if (url == '/') {
			url += 'index.html';
		}
		var result = '/blackbriar/www/' + currentSection + '/' + url;
		return result.replace(/\/\//, '/');
	};

	request.setDomain('main.0x101.com');
	request.setUrl('/testing/filename.html');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/testing/filename.html');

	request.setUrl('/filename.html');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/filename.html');

	request.setUrl('/');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/index.html');

	request.setDomain('invalid.0x101.com');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/index.html');

	request.setDomain('invalid.0x101.com');
	request.setUrl('/invalid/folder/data.html');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/invalid/folder/data.html');

	request.setDomain('blog.0x101.com');
	request.setUrl('/post/category/slug');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/');

	request.setDomain('blog.0x101.com');
	request.setUrl('/category/slug');
	test.equal(Router.getFileName(request), '/blackbriar/www/main/category/slug');

	test.done();
};
