var $injector = require('../Injector');

function ResourceFinder() {
	function findOne(resource, objectId) {
		// console.log('one', objectId);
		return resource.model.findById(objectId).exec();
	}

	function findAll(resource, requestParams) {
		// console.log('many', requestParams.params());
		return resource.model.find(requestParams.params()).exec();
	}

	return {
		findOne: findOne,
		findAll: findAll
	};
}

$injector.provide('ResourceFinder', ResourceFinder);