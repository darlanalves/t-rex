var utils = require('./Utils'),
	is = require('is'),
	forEach = require('foreach'),
	ResourceCreator = require('./Creator'),
	ResourceLocator = require('./Locator'),
	ResourceLoader = require('./Loader'),
	ResourceMapper = require('./Mapper'),
	ResourcePopulator = require('./Populator');

function ResourceManager(express) {
	this.app = express;
	this.expressResources = {};
	this.locator = new ResourceLocator(this);
}

function initialize(mongoose, resourcesToLoad) {
	var resources = ResourceLoader.loadResources(resourcesToLoad);

	if (!resources.length) return;

	this.resources = {};

	resources.forEach(function(resource) {
		if (this.resources[resource.name]) {
			throw new DuplicatedResourceError(resource.name);
		}

		this.resources[resource.name] = resource;
	}, this);

	this.mapper = new ResourceMapper(this.resources);
}

ResourceManager.prototype = {
	constructor: ResourceManager,
	initialize: initialize,

	register: registerResource,
	prepareResources: prepareResources,
	getSchema: getResourceSchema,
	getModelMap: function() {
		return this.dependencyMap;
	},

	findResource: findResource,
	createResource: createResource,
	updateResource: updateResource,
	removeResource: removeResource,
	dispatcher: createDispatcher
};

function createDispatcher() {
	//var me = this;
	return function(req, res, next) {
		next();
	};
}

function getResourceSchema(name) {
	var resource = this.resources[name];

	if (resource) {
		return resource.schema;
	}
}

function prepareResources(mongoose) {
	var me = this,
		resources = this.resources;

	me.mongoose = mongoose;

	Object.keys(resources).forEach(function(name) {
		prepareResource(resources[name], mongoose, me);
	});

	populateRelationshipMap(this, mongoose);
}

function prepareResource(resource, mongoose, manager) {
	var schema = resource.schema;

	if (typeof schema === 'function') {
		schema = schema(mongoose);
	}

	resource.schema = schema;

	schema = new mongoose.Schema(schema);
	resource.model = mongoose.model(resource.modelName, schema, resource.collectionName);

	resource.manager = manager;
}

function registerResource(resource) {
	var express = this.app;

	resourceName = resource.name || '';

	this.resources[resourceName] = resource;

	this.expressResources[resourceName] = express.resource(resourceName || null, resource);
}

function createModel(resource, params) {
	var Model = resource.model;
	return new Model(params || {});
}

function findResource(resource, req, res) {
	var resourceName = resource.name;

	if (!resourceName) {
		res.send(400);
		return;
	}

	var modelId = req.params[resourceName] || null,
		model = resource.model,
		query;

	if (modelId) {
		query = this.locator.findOne(model, modelId, req, res);
	} else {
		query = this.locator.findAll(model, modelId, req, res);
	}

	query.then(function handleResults(results) {
		// console.log('results', results);
		if (!results) {
			res.send(404);
			return;
		}

		res.status(200).json(results.toJSON());
	}, function(err) {
		console.log('results', err);
		res.send(500);
	});
}

function createResource(resource, req, res) {
	// TODO drop API params
	var params = getRequestParams(req),
		resourceName = resource.name,
		item = createModel(params);

	item.save(function(err, model, affected) {
		if (err) {
			console.log(err);
			res.send(500);
			return;
		}

		res.status(201)
			.location(utils.getRequestAddress(req) + utils.getResourceURI(resourceName, model._id))
			.json(model._id);
	});
}

function updateResource(resource, req, res) {
	var params = getRequestParams(req),
		resourceName = resource.name,
		item = createModel(params);
}

function removeResource(resource, req, res) {

}

function getRequestParams(request) {
	return req.method === 'get' ? req.query : req.body;
}

function DuplicatedResourceError(name) {
	return new Error('Duplicated resource: ' + name);
}


module.exports = ResourceManager;