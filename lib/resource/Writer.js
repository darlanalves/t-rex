var $injector = require('../Injector'),
	is = require('is'),
	forEach = require('foreach');

$injector.provide('ResourceWriter', function ResourceWriter(mongoose) {

	function updateResource(resource, requestParams) {
		var documents,
			list = requestParams.param('list'),
			multiple = requestParams.api('multiple'),
			promise = new mongoose.Promise(),
			updateList = [],
			updatedDocuments = [],
			Model = resource.model;

		if (list && is.array(list) && multiple) {
			list.forEach(function(item) {
				updateList.push({
					id: item._id,
					values: item
				});

				delete item._id;
			});
		} else {
			var doc = requestParams.params();

			if (!doc._id) {
				promise.resolve(new Error('Missing document property: "_id"'));
				return;
			}

			updateList.push({
				id: doc._id,
				values: doc
			});

			delete doc._id;
		}

		if (!updateList.length) {
			promise.resolve(new Error('Nothing to update'));
		} else {
			var queuedCount = 0;

			// TODO write once
			updateList.forEach(function(doc) {
				var conditions = {
					_id: doc.id
				},
					options = {
						upsert: true,
						multi: true,
						strict: true
					};

				queuedCount++;
				Model.update(conditions, doc.values, options, function() {
					doc.values._id = doc.id;
					updatedDocuments.push(doc.values);
					queuedCount--;

					if (queuedCount === 0) resolve();
				});
			});
		}

		function resolve() {
			if (multiple) {
				documents = updatedDocuments;
			} else {
				documents = updatedDocuments.length ? updatedDocuments[0] : {};
			}

			promise.resolve(null, documents);
		}

		return promise;
	}

	function createResource(resource, requestParams) {
		var documents,
			list = requestParams.param('list'),
			multiple = requestParams.api('multiple'),
			promise = new mongoose.Promise();

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
		update: updateResource
	};

});