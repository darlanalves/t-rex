var $injector = require('../Injector'),
	forEach = require('foreach');

// skip API params and returns the remaining
function Request(request, params) {
	this.originalRequest = request;

	var $params = {},
		apiParams = {},
		apiParameterNames = ['filter', 'sort', 'populate', 'page', 'multiple'];

	function setValue(value, name) {
		$params[name] = value;
	}

	forEach(params, setValue);
	forEach(request.body || {}, setValue);
	this.$params = $params;

	apiParameterNames.forEach(function(param) {
		if (request.query[param]) {
			apiParams[param] = request.query[param];
		}
	});

	this.setupApiParams(apiParams);
}

Request.prototype = {
	constructor: Request,

	params: function(params) {
		if (params) {
			this.$params = params;
			return this;
		}

		return this.$params;
	},

	param: function(name) {
		return typeof this.$params[name] !== 'undefined' ? this.$params[name] : null;
	},

	api: function(name) {
		return this.$api[name];
	},

	apiParams: function() {
		return this.$api;
	},

	setupApiParams: function(apiData) {
		// TODO validate inputs
		this.$api = {
			populate: apiData.populate ? String(apiData.populate).split(',') : false,
			filters: apiData.filters || null,
			sort: apiData.sort || null,
			page: apiData.page || null,
			multiple: String(apiData.multiple) === 'true'
		};
	}
};

$injector.value('Request', Request);