var $injector = require('../Injector'),
	is = require('is');

function Populator(mongoose, ResourceMapper) {
	this.mongoose = mongoose;
	this.mapper = ResourceMapper;
}

Populator.prototype = {
	constructor: Populator,
	populate: populate
};

function populate(documents, pathsToPopulate, Model) {
	var promise = new this.mongoose.Promise(),
		map = this.mapper.getModelMap(),
		chain;

	if (is.string(Model)) {
		Model = this.mongoose.model(Model);
	}

	if (!documents) {
		resolve(true);
		return promise;
	}

	if (pathsToPopulate.length === 0) {
		resolve(null, documents);
		return promise;
	}

	// walks on paths to make sure the required nodes are present.
	// e.g. to populate 'foo.bar.bar' we must include 'foo' and 'foo.bar' paths
	pathsToPopulate.forEach(function(path) {
		var subPath;
		path = path.split('.');

		while (path.pop()) {
			subPath = path.join('.');

			if (!subPath) continue;

			if (pathsToPopulate.indexOf(subPath) === -1) {
				pathsToPopulate.push(subPath);
			}
		}
	});

	pathsToPopulate.sort();

	var i, len, path, subPath, subModel, $utils = $injector.get('$utils');

	for (i = 0, len = pathsToPopulate.length; i < len; i++) populatePath(i);

	function populatePath(i) {
		path = pathsToPopulate[i];
		subPath = Model.modelName + '.' + path;

		if (!map[subPath]) return;

		subModel = Model.model(map[subPath]);

		if (chain) {
			chain = chain.then(populateListFn(path));
		} else {
			chain = populateListFn(path)(documents);
		}
	}

	function populateListFn(path) {
		return function(list) {
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
				list = $utils.pluckFromList(list, path);
			} else {
				options.path = path;
			}

			return Model.populate(list, options).then(function(results) {
				results = originalList || results;
				console.log('>>', results);
				// console.log('populated', results, 'with', options);

				return results;
			});
		};
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

/*function getModelSchemaTree(Model) {
	return Model.schema.tree;
}

function getModelByName(name, Model) {
	return modelCache[name] || (modelCache[name] = Model.model(name));
}*/

$injector.provide('ResourcePopulator', Populator);