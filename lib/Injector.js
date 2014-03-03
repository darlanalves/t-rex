var is = require('is'),
	INSTANTIATING = {};

function Injector() {
	this.$cache = {};
	this.$providers = {};
	this.$privates = {};
}

Injector.prototype = {
	constructor: Injector,

	get: function(name, locals) {
		if (is.array(name)) {
			return name.map(function(item) {
				return this.get(item, locals);
			}, this);
		}

		if (name === '$injector') {
			return this;
		}

		if (locals && locals.hasOwnProperty(name)) {
			return locals[name];
		}

		var cache = this.$cache;

		if (cache.hasOwnProperty(name)) {
			return cache[name];
		}

		if (!this.$providers.hasOwnProperty(name)) {
			throw new DependencyNotFoundError(name);
		}

		if (cache[name] === INSTANTIATING) {
			throw new CircularDependencyError(name);
		}

		try {
			cache[name] = INSTANTIATING;
			cache[name] = this.instantiate(this.$providers[name], locals);
		} catch (e) {
			if (cache[name] === INSTANTIATING) {
				delete cache[name];
			}

			throw e;
		}

		var resource = cache[name];

		if (true === this.$privates[name]) {
			delete cache[name];
		}

		return resource;
	},

	has: function() {
		return this.$providers.hasOwnProperty(name);
	},

	instantiate: function(Type, locals) {
		var Constructor = function() {},
			instance, returnedValue;

		Constructor.prototype = (is.array(Type) ? Type[Type.length - 1] : Type).prototype;

		instance = new Constructor();
		returnedValue = this.invoke(Type, instance, locals);

		return (is.object(returnedValue) || is.function(returnedValue)) ? returnedValue : instance;
	},

	invoke: function(invokable, self, locals) {
		var dependencies, method, args = [];

		if (is.array(invokable)) {
			dependencies = invokable.slice(0);
			method = dependencies.pop();
		} else {
			if (!('$inject' in invokable)) {
				dependencies = this.parse(invokable);
			} else {
				dependencies = invokable.$inject;
			}

			method = invokable;
		}

		if (dependencies.length) {
			args = this.get(dependencies, locals);
		}

		return method.apply(self, args);
	},

	annotate: function() {
		var args = Array.prototype.slice.call(arguments),
			fn = args.pop();

		fn.$inject = args;

		return fn;
	},

	parse: (function() {
		var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

		return function(fn) {
			if (!is.function(fn)) {
				throw new Error('Invalid function: ' + fn);
			}

			var match = fn.toString().match(FN_ARGS),
				fnArgs = match[1];

			return fnArgs && fnArgs.split(',').map(function(arg) {
				return arg.trim();
			}) || [];
		}
	}()),

	provide: function(name, value, isPrivate) {
		var provider;

		if (is.array(value)) {
			provider = value;
		} else if (is.function(value)) {
			provider = this.parse(value);
			provider.push(value);
		} else {
			this.value(name, value);
		}

		if (provider) {
			if (this.$providers.hasOwnProperty(name)) {
				throw new DependencyAlreadyExistsError(name);
			}

			this.$providers[name] = this.annotate.apply(null, provider);
			if (isPrivate) {
				this.$privates[name] = true;
			}
		}

		return this;
	},

	value: function(name, value) {
		this.$cache[name] = value;
		return this;
	},

	load: function(list) {
		return {
			from: function(path) {
				list.forEach(function(name) {
					require(path + name);
				});
			}
		};
	}
};

function DependencyNotFoundError(name) {
	var e = new Error('Dependency not found: ' + name);
	e.name = 'DependencyNotFoundError';
	return e;
}

function DependencyAlreadyExistsError(name) {
	var e = new Error('Cannot register, dependency already exists: ' + name);
	e.name = 'DependencyAlreadyExistsError';
	return e;
}

function CircularDependencyError(name) {
	var e = new Error('Circular dependency found: ' + name);
	e.name = 'CircularDependencyError';
	return e;
}

module.exports = new Injector();