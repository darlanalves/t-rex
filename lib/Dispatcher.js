var $injector = require('./Injector'),
	ObjectId = require('mongoose').Schema.Types.ObjectId,
	//q = require('q'),
	forEach = require('foreach');

var FORBID = 'f',
	CREATE = 'c',
	READ = 'r',
	UPDATE = 'u',
	DELETE = 'd',
	INDEX = 'l';

function Dispatcher(ResourceRegistry, ResourceMapper, ResourcePopulator, ResourceFinder) {

	function makeDispatcher(resource, method, allowed) {
		return function(request, response) {
			var params = {},
				resourceParents = ResourceMapper.getResourceParents(resource.name);

			// forEach skips the new Map object
			Object.keys(request.params).forEach(function(key) {
				if (!ResourceRegistry.has(key)) return;

				if (resourceParents.indexOf(key) !== -1) {
					params[key] = new ObjectId(request.params[key]);
				}
			});

			request = new RequestParams(request, params);
			response.locals.resource = resource;

			switch (method) {
				case CREATE:
					createResource(resource, request, response);
					break;

				case READ:
					findResource(resource, request, response);
					break;

				case UPDATE:
					updateResource(resource, request, response);
					break;

				case DELETE:
					removeResource(resource, request, response);
					break;

				case INDEX:
					findResource(resource, request, response);
					break;

				case FORBID:
					allowed = allowed.join(', ');
					response.set('Allow', allowed).send(405);
					break;
			}
		};
	}

	/**
	 * GET     /resource                 ->  index
	 * GET     /resource/new             ->  new
	 * POST    /resource                 ->  create
	 * GET     /resource/:resource       ->  show
	 * GET     /resource/:resource/edit  ->  edit
	 * PUT     /resource/:resource       ->  update
	 * DELETE  /resource/:resource       ->  destroy
	 */

	function registerRoutes() {
		var app = $injector.get('expressApp');

		ResourceRegistry.forEach(function(resource) {
			var resourceName = resource.name,

				resourceParents = ResourceMapper.getResourceParents(resourceName),
				parentUrlParts = buildParentUrlParts(resourceParents),
				resourceUrl = parentUrlParts + '/' + resourceName,
				resourceUrlWithId = resourceUrl + '/:' + resourceName;

			if (resource.writeOnly) {
				var allowedWriteMethods = ['POST', 'PUT', 'DELETE'];
				app.get(resourceUrl, makeDispatcher(resource, FORBID, allowedWriteMethods));
				app.get(resourceUrlWithId, makeDispatcher(resource, FORBID, allowedWriteMethods));
			} else {
				app.get(resourceUrl, makeDispatcher(resource, INDEX));
				app.get(resourceUrlWithId, makeDispatcher(resource, READ));
			}

			if (resource.readOnly) {
				var allowedReadMethods = ['GET', 'HEAD'];
				app.post(resourceUrl, makeDispatcher(resource, FORBID, allowedReadMethods));
				app.put(resourceUrlWithId, makeDispatcher(resource, FORBID, allowedReadMethods));
				app.del(resourceUrlWithId, makeDispatcher(resource, FORBID, allowedReadMethods));
			} else {
				app.post(resourceUrl, makeDispatcher(resource, CREATE));
				app.put(resourceUrlWithId, makeDispatcher(resource, UPDATE));
				app.del(resourceUrlWithId, makeDispatcher(resource, DELETE));
			}
		});

		function buildParentUrlParts(tree) {
			var url = [];

			if (tree.length) {
				tree.forEach(function(parentName) {
					url.push(parentName + '/:' + parentName);
				});
			}

			url = url.join('/');

			return url ? '/' + url : '';
		}
	}

	function findResource(resource, request, response) {
		var objectId = request[resource.name] || null,
			results;

		function populateResults(results) {
			var populate = request.api('populate');

			if (populate) {
				return ResourcePopulator.populate(results, populate, resource.model);
			}

			return results;
		}

		if (objectId) {
			results = ResourceFinder.findOne(resource, objectId).then(populateResults);
		} else {
			results = ResourceFinder.findAll(resource, request).then(populateResults);
		}

		results.then(function(data) {
			response.status(200).json(data);
		}, function() {
			response.send(500);
		});
	}

	/*
function findResource(request, response) {
	//resource.modelName
		// TODO only add param if there's a relation between the two items


	result.then(function(results) {
		if (!results) {
			response.send(204);
			return;
		}

		response.status(200).json(results);
	}, function(err) {
		console.log('Server fault: ', err);
		response.send(500);
	});
}



	app.post(resourceUrl, function createResource(request, response) {
		var params = getRequestParams(request),
			resourceName = resource.name,
			newResource = createModel(resource, params);

		newResource.save(function(err, model, affected) {
			if (err) {
				response.send(500);
				return;
			}

			response.status(201)
				.location(utils.getRequestAddress(request) + utils.getResourceURI(resourceName, model._id))
				.json(model._id);
		});
	});

	app.put(resourceUrlWithId, function updateResource(request, response) {
		var params = getRequestParams(request),
			resourceName = resource.name,
			objectId = request.params[resourceName] || null;

		finder.findOne(objectId).then(function(foundResource) {
			foundResource.set(params);
			foundResource.save(function(err, model, affected) {
				if (err) {
					response.send(500);
					return;
				}

				console.log(err, model, affected);
				response.send(200);
			});
		});
	});

	app.del(resourceUrlWithId, function removeResource(request, response) {

	});
}*/

	function createModel(resource, params) {
		var Model = resource.model;
		return new Model(params || {});
	}

	// skip API params and returns the remaining params
	function RequestParams(request, params) {
		this.$$request = request;

		forEach(params, setValue);
		forEach(request.query, setValue);
		forEach(request.body || {}, setValue);

		var $params = {},
			apiParams = {},
			apiParameterNames = ['filter', 'sort', 'populate', 'page'];

		function setValue(value, name) {
			if (apiParameterNames.indexOf(name) === -1) {
				$params[name] = value;
			} else {
				apiParams[name] = value;
			}
		}

		this.$params = $params;
		this.setupApiParams(apiParams);
	}

	RequestParams.prototype = {
		constructor: RequestParams,

		params: function() {
			return this.$params;
		},

		param: function(name) {
			return typeof this.$params[name] !== 'undefined' ? this.$params[name] : null;
		},

		api: function(name) {
			return this.$api[name];
		},

		apiParams: function() {
			return this.$api;
		},

		setupApiParams: function(apiData) {
			// TODO validate input
			this.$api = {
				populate: apiData.populate ? String(apiData.populate).split(',') : false,
				filters: apiData.filters || null,
				sort: apiData.sort || null,
				page: apiData.page || null,
			};
		}
	};

	return {
		registerRoutes: registerRoutes
	};
}

$injector.provide('ResourceDispatcher', Dispatcher);