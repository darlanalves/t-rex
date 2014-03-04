var $injector = require('./Injector'),
	//q = require('q'),
	forEach = require('foreach'),
	is = require('is');

var FORBID = 'f',
	CREATE = 'c',
	READ = 'r',
	UPDATE = 'u',
	DELETE = 'd',
	INDEX = 'l';

function Dispatcher(ResourceRegistry, ResourceMapper, ResourcePopulator, ResourceFinder, ResourceWriter, ResourceDestroyer, $utils, mongoose) {
	var ObjectId = mongoose.Schema.Types.ObjectId;

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
				app.post(resourceUrl, [verifyIncomingFormat, makeDispatcher(resource, CREATE)]);
				app.put(resourceUrlWithId, [verifyIncomingFormat, makeDispatcher(resource, UPDATE)]);
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

		function verifyIncomingFormat(req, res, next) {
			if (!req.is('json')) {
				res.set('Accept', 'application/json');
				res.send(406);
				next('route');
			}

			next();
		}
	}

	function makeDispatcher(resource, method, allowed) {
		return function(request, response, next) {
			var params = {},
				resourceParents = ResourceMapper.getResourceParents(resource.name);

			// forEach skips the new Map object
			Object.keys(request.params).forEach(function(key) {
				if (!ResourceRegistry.has(key)) return;

				params[key] = request.params[key];
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

				default:
					next();
			}
		};
	}

	function findResource(resource, request, response) {
		var objectId = request.param(resource.name) || null,
			results;

		function populateResults(results) {
			var populate = request.api('populate');

			if (results && populate) {
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
			if (!data) {
				return response.status(404);
			}

			response.status(200).json(data);
		}, function(err) {
			handleApiError(response, err);
		});
	}

	function createResource(resource, request, response) {
		ResourceWriter.create(resource, request).then(function(models) {
			// response.location($utils.getRequestAddress(request.$request) + $utils.getResourceURI(resource.name, models._id))
			response.json(201, models);

		}, function(error) {
			handleApiError(response, error);
		});
	}

	function updateResource(resource, request, response) {
		var objectId = request.params[resource.name] || null;

		if (!objectId) {
			return response.send(400);
		}

		ResourceFinder.findOne(objectId).then(function(foundResource) {
			if (!foundResource) {
				response.send(404);
			}

			return ResourceWriter.update(foundResource, request.params()).then(function(model) {
				response.send(200);
			}, errorHandler);
		}, errorHandler);

		function errorHandler(error) {
			handleApiError(response, error);
		}
	}

	function removeResource(resource, request, response) {
		var objectId = request.param(resource.name) || null;

		if (!objectId) {
			return response.send(400);
		}

		function errorHandler(error) {
			response.send(500);
		}

		ResourceDestroyer.removeOne(resource, objectId).then(function() {
			response.send(200);
		}, function(error) {
			handleApiError(response, error)
		})
	}

	function handleApiError(response, error) {
		console.log('ServerError', error);
		response.send(500);
	}

	// skip API params and returns the remaining params
	function RequestParams(request, params) {
		this.$$request = request;

		var $params = {},
			apiParams = {},
			apiParameterNames = ['filter', 'sort', 'populate', 'page', 'multiple'];

		function setValue(value, name) {
			$params[name] = value;
		}

		forEach(params, setValue);
		forEach(request.body || {}, setValue);
		this.$params = $params;

		apiParameterNames.forEach(function(param) {
			if (request.query[param]) {
				apiParams[param] = request.query[param];
			}
		});

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
			// TODO validate inputs
			this.$api = {
				populate: apiData.populate ? String(apiData.populate).split(',') : false,
				filters: apiData.filters || null,
				sort: apiData.sort || null,
				page: apiData.page || null,
				multiple: String(apiData.multiple) === 'true'
			};
		}
	};

	return {
		registerRoutes: registerRoutes
	};
}

$injector.provide('ResourceDispatcher', Dispatcher);