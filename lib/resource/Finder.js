var $injector = require('../Injector');

function ResourceFinder() {
	function findOne(resource, objectId) {
		console.log('one', objectId);
		return resource.model.findById(objectId).exec();
	}

	function findAll(resource, filters) {
		console.log('many', filters);
		return resource.model.find(filters).exec();
	}

	return {
		findOne: findOne,
		findAll: findAll
	};
}

$injector.provide('ResourceFinder', ResourceFinder);