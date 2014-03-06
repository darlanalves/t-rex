var $injector = require('../Injector'),
	is = require('is'),
	forEach = require('foreach');

$injector.provide('ResourceWriter', function ResourceWriter(mongoose) {

	function saveResource(resource, params) {
		return newModel.save().then(function() {
			return newModel;
		});
	}

	function createResource(resource, requestParams) {
		var documents,
			list = requestParams.param('list'),
			multiple = requestParams.api('multiple'),
			promise = new mongoose.Promise();

		console.log(requestParams.originalRequest.body);
		if (list && is.array(list) && multiple) {
			documents = list.map(function(item) {
				return new resource.model(item);
			});
		} else {
			documents = [new resource.model(requestParams.params())];
		}

		if (!documents.length) {
			promise.resolve(new Error('Missing items to create'));
		} else {
			resource.model.create(documents, function() {
				var documents = Array.prototype.slice.call(arguments),
					err = documents.shift();

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
			}, function(err) {
				promise.resolve(err);
			});
		}

		return promise;
	}

	function createResourceModel(resource, params) {
		var Model = resource.model;
		return new Model(params || {});
	}

	return {
		create: createResource,
		update: saveResource
	};

});