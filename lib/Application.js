var ResourceManager = require('./resource/Manager');

/**
 * @param {Object} express  Express server instance
 * @param {Object} db       MongooseReady instance
 */
function Application(express, db) {
	this.app = express;
	this.db = db;
	this.resourcesToLoad = [];

	var resourceManager = new ResourceManager(express),
		me = this;

	db.ready(function(mongoose) {
		var port = me.$port;

		resourceManager.initialize(mongoose, me.resourcesToLoad);

		me.app.use(express.compress())
			.use(express.json())
			.use(express.urlencoded())
			.use(resourceManager.dispatcher())
			.app.listen(port);

		console.log('Listening on port ' + port);

		me.app = me.db = me.resourcesToLoad = null;
	});

	db.error(function() {
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
		this.db.ready(fn);
		return this;
	},

	error: function(fn) {
		this.db.error(fn);
		return this;
	},

	listen: function(port) {
		this.$port = port;
		this.db.connect(this.$dsn);
		return this;
	}
};

module.exports = Application;