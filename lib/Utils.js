var is = require('is');

var utils = {
	filterOutObjectProperties: function(object, properties) {
		if (typeof properties === 'string') {
			properties = [properties];
		}

		var matcher = new RegExp('^(' + properties.join('|') + ')$');

		function checkProperty(name) {
			if (matcher.test(name) === true) {
				delete this[name];
			}

			if ('object' === typeof this[name]) {
				walkObject(this[name], checkProperty);
			}
		}

		walkObject(object, checkProperty);

		return object;
	},

	getRequestAddress: function(req) {
		return req.protocol + '://' + req.host + ':' + process.env.PORT;
	},

	getResourceURI: function(name, modelId) {
		return '/' + name + (modelId ? '/' + modelId : '');
	},

	walkObject: walkObject,

	getProperty: getProperty,

	pluckFromList: function pluckFromList(list, path) {
		if (!is.array(list)) {
			return getProperty(list, path);
		}

		return list.map(function(obj) {
			return getProperty(obj, path);
		});
	},

	unpluckOnList: function unpluckOnList(list, path, values) {
		if (!is.array(list)) {
			return setProperty(list, path, values);
		}

		var valuesAreArray = is.array(values);

		return list.map(function(obj, index) {
			var value = valuesAreArray ? values[index] : values;
			return setProperty(obj, path, value);
		});
	},

	pluck: getProperty,
	unpluck: setProperty
};

function getProperty(obj, path) {
	path = path.split('.');

	var part, i = 0,
		len = path.length,
		ref = obj;

	for (; i < len; i++) {
		part = path[i];
		ref = ref[part];

		if (typeof ref === 'undefined') return;
	}

	return ref;
}

function setProperty(obj, path, value) {
	path = path.split('.');

	var part, i = 0,
		len = path.length,
		ref = obj,
		last = path.pop();

	for (; i < len; i++) {
		part = path[i];
		ref = ref[part];

		if (typeof ref === 'undefined') return;
	}

	return obj[last] = value;
}

function walkObject(object, walker) {
	Object.keys(object).forEach(walker, object);
}

module.exports = utils;