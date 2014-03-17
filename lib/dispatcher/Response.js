var $injector = require('../Injector'),
	forEach = require('foreach');

function Response(response) {
	this.originalResponse = response;
	this._headers = {};
}

Response.prototype = {
	_status: 200,

	dispatch: function() {
		var response = this.originalResponse;

		if (this.hasHeaders) {
			forEach(this._headers, function(value, name) {
				response.set(name, value);
			});
		}

		if (this._error) {
			console.log('>> API ERROR: ', this._error);
		}

		response.json(this._status, this._data || {});
	},

	status: function(status) {
		if (arguments.length === 0) return this._status;

		this._status = status;
		return this;
	},

	data: function(data) {
		if (arguments.length === 0) return this._data;

		this._data = data;
		return this;
	},

	error: function(error) {
		if (arguments.length === 0) return this._error;

		this._error = error;
		return this;
	},

	header: function(name, value) {
		if (name) {
			this.hasHeaders = true;
			this._headers[name] = value;
			return this;
		}

		return this._headers[name] || null;
	}
};

$injector.value('Response', Response);