var $injector = require('./Injector');
// forEach = require('foreach');

function Dispatcher(ResourceRegistry, ResourceMapper, ResourcePopulator, ResourceFinder, ResourceWriter, ResourceDestroyer, mongoose, Request, Response, PreProcessors, PostProcessors) {

	/**
	 * GET     /resource                 ->  index
	 * GET     /resource/new             ->  new
	 * POST    /resource                 ->  create
	 * GET     /resource/:resource       ->  show
	 * GET     /resource/:resource/edit  ->  edit
	 * PUT     /resource/:resource       ->  update
	 * DELETE  /resource/:resource       ->  destroy
	 */
	var CREATE = 'c',
		READ = 'r',
		UPDATE = 'u',
		DELETE = 'd',
		INDEX = 'l';

	function dispatchRequest(method, resource, requestParams, response) {
		switch (method) {
			case CREATE:
				return createResource(resource, requestParams, response);

			case READ:
				return findResource(resource, requestParams, response);

			case UPDATE:
				return updateResource(resource, requestParams, response);

			case DELETE:
				return removeResource(resource, requestParams, response);

			case INDEX:
				return findResource(resource, requestParams, response);
		}
	}

	function makeForbiddance(allowed) {
		return function(request, response) {
			response = new Response(response);

			allowed = allowed.join(', ');
			return response.header('Allow', allowed).status(405).dispatch();
		};
	}

	function makeDispatcher(resource, method) {
		return function(request, response, next) {
			request = new Request(request, getRequestParams(request));
			response = new Response(response);

			runPreProcessors(request, response, function(err) {
				if (err) {
					response.status(500).dispatch();
					return next('route');
				}

				if (response.status() >= 400) {
					response.dispatch();
					return next('route');
				}

				dispatchRequest(method, resource, request, response).then(function() {
					runPostProcessors(request, response, function() {
						response.dispatch();
					});
				}, function() {
					response.status(500).dispatch();
					next('route');
				});
			});
		};
	}

	function getRequestParams(request) {
		var params = {};

		//forEach would skip the params
		Object.keys(request.params).forEach(function(key) {
			if (!ResourceRegistry.has(key)) return;

			params[key] = request.params[key];
		});

		return params;
	}

	function runPreProcessors(request, response, next) {
		runProcessors(PreProcessors, request, response, next);
	}

	function runPostProcessors(request, response, next) {
		runProcessors(PostProcessors, request, response, next);
	}

	function runProcessors(list, request, response, next) {
		var stackIndex = 0,
			fn = null;

		function callback(err) {
			if ('route' === err) {
				return next(err);
			}

			fn = list[stackIndex++];
			if (!fn) {
				return next();
			}

			try {
				if (fn.length < 4) {
					return fn(request, response, callback);
				}

				fn(err, request, response, callback);
			} catch (e) {
				next(e);
			}
		}

		var error = response.error();
		callback(error);
	}

	function findResource(resource, request, response) {
		var objectId = request.param(resource.name) || null,
			promise = new mongoose.Promise(),
			results;

		function resolve(err, result) {
			process.nextTick(function() {
				if (promise) promise.resolve(err, result);
				promise = null;
			});
		}

		function populateResults(results) {
			var populate = request.api('populate');

			if (results && populate) {
				return ResourcePopulator.populate(results, populate, resource.model).then(function(documents) {
					return documents;
				});
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
				response.status(204);
			} else {
				response.status(200).data(data);
			}

			resolve(null, data);
		}, function(error) {
			handleApiError(error, response);
			resolve(error);
		});

		return promise;
	}

	function createResource(resource, request, response) {
		return ResourceWriter.create(resource, request).then(function(models) {
			// response.location($utils.getRequestAddress(request.$request) + $utils.getResourceURI(resource.name, models._id))
			response.status(201);
			return response.data(models);
		}, function(error) {
			return handleApiError(error, response);
		});
	}

	function updateResource(resource, request, response) {
		return ResourceWriter.update(resource, request).then(function(models) {
			response.status(200);
			return response.data(models);
		}, function(error) {
			return handleApiError(error, response);
		});
	}

	function removeResource(resource, request, response) {
		var objectId = request.param(resource.name) || null;

		if (!objectId) {
			var promise = new mongoose.Promise(function() {
				return response.status(400);
			});

			process.nextTick(function() {
				promise.resolve(null, response);
			});

			return promise;
		}

		return ResourceDestroyer.removeOne(resource, objectId).then(function() {
			return response.status(200);
		}, function(error) {
			return handleApiError(response, error);
		});
	}

	function handleApiError(error, response) {
		return response.status(500).error(error);
	}

	function registerRoutes() {
		var app = $injector.get('expressApp');

		ResourceRegistry.forEach(function(resource) {
			var resourceName = resource.name,
				parentResources = ResourceMapper.getResourceParents(resourceName),
				parentResourcesPath = buildParentUrlParts(parentResources),
				resourceUrl = parentResourcesPath + '/' + resourceName,
				resourceUrlWithId = resourceUrl + '/:' + resourceName;

			if (resource.writeOnly) {
				var allowedWriteMethods = ['POST', 'PUT', 'DELETE'];
				app.get(resourceUrl, makeForbiddance(allowedWriteMethods));
				app.get(resourceUrlWithId, makeForbiddance(allowedWriteMethods));
			} else {
				app.get(resourceUrl, makeDispatcher(resource, INDEX));
				app.get(resourceUrlWithId, makeDispatcher(resource, READ));
			}

			if (resource.readOnly) {
				var allowedReadMethods = ['GET', 'HEAD'];
				app.post(resourceUrl, makeForbiddance(allowedReadMethods));
				app.put(resourceUrlWithId, makeForbiddance(allowedReadMethods));
				app.del(resourceUrlWithId, makeForbiddance(allowedReadMethods));
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

	return {
		registerRoutes: registerRoutes
	};
}

$injector.provide('ResourceDispatcher', Dispatcher);