var express = require('express'),
	mongooseReady = require('mongoose-ready')(),
	$injector = require('./Injector');

/**
 * @param {Object} express  Express server instance
 * @param {Object} db       MongooseReady instance
 */
function Application() {
	var e = new Error();

	// console.log(e.stack);

	var me = this;

	this.app = express();
	this.resourcesToLoad = [];

	$injector.value('expressApp', this.app);

	mongooseReady.ready(function(mongoose) {
		var port = me.$port;

		$injector.value('mongoose', mongoose);
		$injector.get('ResourceLoader').initialize(me.resourcesToLoad);
		$injector.get('ResourceDispatcher').registerRoutes();

		me.app.use(express.compress())
			.use(express.bodyParser())
			.listen(port);

		console.log('Listening on port ' + port);

		me.app = me.db = me.resourcesToLoad = null;
	});

	mongooseReady.error(function() {
		console.log('Connection to <<' + me.$dsn + '>> failed');
		console.log('Server is shutting down!');
		process.exit();
	});
}

Application.prototype = {
	constructor: Application,

	dsn: function(dsn) {
		this.$dsn = dsn;
		return this;
	},

	path: function(root) {
		this.resourcePath = root;
		return this;
	},

	resources: function(path, list) {
		this.resourcesToLoad.push({
			path: path,
			list: list
		});

		return this;
	},

	use: function(middleware) {
		this.app.use(middleware);
		return this;
	},

	ready: function(fn) {
		mongooseReady.ready(fn);
		return this;
	},

	error: function(fn) {
		mongooseReady.error(fn);
		return this;
	},

	listen: function(port) {
		this.$port = port;
		mongooseReady.connect(this.$dsn);
		return this;
	}
};

$injector.provide('Application', Application);