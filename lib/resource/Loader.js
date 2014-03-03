var expressApp = require('express'),
	$injector = require('../Injector');

function ResourceLoader(ResourceReader, ResourcePopulator, ResourceRegistry, ResourceMapper, $injector, mongoose) {

	function initialize(resourcesToLoad) {
		var foundResources = ResourceReader.getResources(resourcesToLoad);

		if (!foundResources.length) return;

		function registerResource(resource) {
			var name = resource.name;

			if (ResourceRegistry.has(name)) {
				throw new DuplicatedResourceError(name);
			}

			resource.model = createResourceModel(resource, mongoose);
			ResourceRegistry.set(name, resource);
		}

		foundResources.forEach(registerResource, this);
		ResourceMapper.buildMap();
	}

	return {
		initialize: initialize
	};
}

function createResourceModel(resource, mongoose) {
	var schema = resource.schema;

	if (typeof schema === 'function') {
		schema = schema(mongoose);
	}

	resource.schema = schema;

	schema = new mongoose.Schema(schema, resource.schemaOptions);
	return mongoose.model(resource.modelName, schema, resource.collectionName);
}

function DuplicatedResourceError(name) {
	var e = new Error('Duplicated resource: ' + name);
	e.name = 'DuplicatedResourceError';
	return e;
}

$injector.provide('ResourceLoader', ResourceLoader);