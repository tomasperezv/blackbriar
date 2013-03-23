/**
 * @author tom@0x101.com
 *
 * Basic cache strategy.
 */

Cache = function() {

	this._keyPrefix = '_';

	this._cache = {};

};

/**
 * Return the contents of the last query executed in the DB as an array of
 * objects. (Each element of the array is a row)
 * @return Array
 */

Cache.prototype.get = function(key) {

	var data = null;

	if (typeof this._cache[key] !== 'undefined') {
		data = this._cache[key];
	}

	return data;

};

/**
 * Given the information provided by the database-model, it returns
 * the cache key that corresponds.
 *
 * @return {String}
 */

Cache.prototype.getKey = function(table, filters) {

	var key = table;

	if (typeof filters !== 'undefined') {
		for (var filterKey in filters) {
			if (filters.hasOwnProperty(filterKey) && typeof filters[filterKey] !== 'undefined') {
				key += this._keyPrefix + filters[filterKey];
			}
		}
	}

	return key;

};

/**
 * Set a value in the cache layer.
 * @param {String} key
 * @param {Object} value
 */

Cache.prototype.set = function(key, value) {
	this._cache[key] = value;
};

// Only store one instance of the cache storage
var cacheStrategy = cacheStrategy ? cacheStrategy : new Cache();

exports.CacheStrategy = cacheStrategy;
