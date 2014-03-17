var $injector = require('../Injector');

function ResourceFinder() {
	function findOne(resource, objectId) {
		return resource.model.findById(objectId).exec().then(function(result) {
			return result.toJSON();
		});
	}

	function findAll(resource, requestParams) {
		var mongoose = $injector.get('mongoose'),
			promise = new mongoose.Promise();

		resource.model.find(requestParams.api('filter') || {}, function(err, results) {
			if (!promise) return;

			if (err) {
				resolve(err);
				return;
			}

			results = Array.prototype.slice.call(results).map(function(item) {
				return item.toJSON();
			});

			resolve(null, results);
		});

		function resolve(err, response) {
			process.nextTick(function() {
				promise.resolve(err, response);
			});
		}

		return promise;
	}

	/*function toJSON(results) {
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
	}*/


	return {
		findOne: findOne,
		findAll: findAll
	};
}

$injector.provide('ResourceFinder', ResourceFinder);