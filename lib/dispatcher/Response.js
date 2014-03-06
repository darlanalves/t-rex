var $injector = require('../Injector'),
	forEach = require('foreach');

function Response(response) {
	this.originalResponse = response;
	this._headers = {};
}

Response.prototype = {
	_status: 200,

	dispatch: function() {
		var response = this.originalResponse,
			status = this._status;

		if (this.hasHeaders) {
			forEach(this._headers, function(value, name) {
				response.set(name, value);
			});
		}

		response.json(this._status, this._data || {}).end();
	},

	status: function(status) {
		this._status = status;
		return this;
	},

	data: function(data) {
		this._data = data;
		return this;
	},

	error: function(error) {
		if (error) {
			this._error = error;
			return this;
		}

		return this._error;
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