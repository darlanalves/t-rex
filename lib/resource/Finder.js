var $injector = require('../Injector');

function ResourceFinder() {
	function findOne(resource, objectId) {
		return resource.model.findById(objectId).exec().then(function(result) {
			console.log('one', objectId, result);
			return result.toJSON();
		});
	}

	function findAll(resource, requestParams) {
		// console.log('many', requestParams.params());
		return resource.model.find(requestParams.params()).exec().then(function(results) {

		});
	}

	function toJSON(results) {
		var documents = Array.prototype.slice.call(results);

		if (err) {
			promise.resolve(err);
			return;
		}

		if (multiple) {
			documents = documents.map(function(item) {
				return item.toJSON();
			});
		} else {
			documents = documents[0].toJSON();
		}

		promise.resolve(null, documents);
	}

	return {
		findOne: findOne,
		findAll: findAll
	};
}

$injector.provide('ResourceFinder', ResourceFinder);