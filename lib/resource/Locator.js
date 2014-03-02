var utils = require('./Utils'),
	is = require('is'),
	modelCache = {};

function ResourceLocator(manager) {
	this.manager = manager;
}

ResourceLocator.prototype = {
	constructor: ResourceLocator,

	findOne: findOne,
	findAll: findAll,
	removeOne: removeOne,
	deepPopulate: deepPopulate
};

function findOne(Model, modelId, req, res) {
	var populate = req.query.populate ? String(req.query.populate).split(',') : false,
		me = this,
		query = Model.findById(modelId);

	if (populate) {
		return query.exec().then(function(results) {
			return me.deepPopulate(results, populate, Model);
		});
	}

	return query.exec();
}

function findAll(Model, modelId, req, res) {
	var populate = req.query.populate ? String(req.query.populate).split(',') : false,
		filters = {};

	return Model.find(filters);
}

function deepPopulate(documents, paths, Model) {
	var promise = new this.manager.mongoose.Promise(),
		map = this.manager.getModelMap(),
		chain;

	if (!documents) {
		resolve(true);
		return promise;
	}

	if (paths.length === 0) {
		resolve(null, documents);
		return promise;
	}

	// walks on paths to make sure the required nodes are present.
	// e.g. to populate 'foo.bar.bar' we must include 'foo' and 'foo.bar' paths
	paths.forEach(function(path) {
		var subPath;
		path = path.split('.');

		while (path.pop()) {
			subPath = path.join('.');

			if (!subPath) continue;

			if (paths.indexOf(subPath) === -1) {
				paths.push(subPath);
			}
		}
	});

	paths.sort();

	var lastHandler, i, len, path, subPath, subModel, counter = 0;

	for (i = 0, len = paths.length; i < len; i++) {
		path = paths[i];
		subPath = Model.modelName + '.' + path;

		if (!map[subPath]) continue;

		subModel = Model.model(map[subPath]);

		if (chain) {
			chain = chain.then(function(list) {
				return fn(list, path);
			});
		} else {
			chain = fn(documents, path);
		}
	}

	function fn(list, path) {
		var dotIndex = path.indexOf('.'),
			originalList = false,
			options = {
				model: subModel.modelName
			};

		if (dotIndex !== -1) {
			path = path.split('.');
			options.path = path.pop();
			path = path.join('.');

			originalList = list;
			list = utils.pluckFromList(list, path);
		} else {
			options.path = path;
		}

		return Model.populate(list, options).then(function(results) {
			results = originalList || results;

			//console.log('populated', results, 'with', options);

			return results;
		});
	}

	process.nextTick(function() {
		// skip invalid paths
		if (!chain) {
			resolve(null, documents);
			return;
		}

		chain.then(function(result) {
			resolve(null, result);
		}, function(err) {
			resolve(err);
		});
	});

	function resolve(err, val) {
		process.nextTick(function() {
			promise.resolve(err, val);
		});
	}

	return promise;
}

function getModelSchemaTree(Model) {
	return Model.schema.tree;
}

function getModelByName(name, Model) {
	return modelCache[name] || (modelCache[name] = Model.model(name));
}

function getSchemaFromPath(path, Model) {
	var schemaTree = Model.schema.tree;

	path = path.split('.');
	path.forEach(function(part) {

	});
}

module.exports = ResourceLocator;