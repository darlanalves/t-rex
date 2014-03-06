var $injector = require('../Injector'),
	forEach = require('foreach');

function Response(response) {
	this.response = response;
}

Response.prototype = {
	_status: 200,

	dispatch: function() {
		var response = this.response;

		if (this.hasHeaders) {
			forEach(this.headers, function(value, name) {
				response.set(name, value);
			});
		}

		response.json(this._status, this._data);
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
		this.hasHeaders = true;

		var o = this._headers || (this._headers = {});
		o[name] = value;

		return this;
	}
};

$injector.value('Response', Response);