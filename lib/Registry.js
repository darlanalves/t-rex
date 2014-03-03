var $injector = require('./Injector');

function Registry() {
	this.items = {};
}

Registry.prototype = {
	get: function(name) {
		return this.items[name] || null;
	},

	set: function(name, value) {
		return this.items[name] = value;
	},

	has: function(name) {
		return name in this.items;
	},

	forEach: function(fn, scope) {
		Object.keys(this.items).forEach(function(name) {
			fn.call(scope || null, this[name]);
		}, this.items);
	}
};

$injector.value('Registry', Registry);