var writeMethodNames = ['new', 'create', 'edit', 'update', 'destroy'],
	utils = require('./Utils');

function Resource(config) {
	var resource = {
		schema: config.schema
	};

	var name = resource.name = config.name || '';

	resource.modelName = config.modelName || name;
	resource.collectionName = config.collectionName || name;

	var isReadOnlyResource = resource.readOnly = !! config.readOnly,
		isWriteOnlyResource = resource.writeOnly = !! config.writeOnly;

	function createResource(req, res) {
		resource.manager.createResource(resource, req, res);
	}

	function findResource(req, res) {
		resource.manager.findResource(resource, req, res);
	}

	function updateResource(req, res) {
		resource.manager.updateResource(resource, req, res);
	}

	function removeResource(req, res) {
		resource.manager.removeResource(resource, req, res);
	}

	function forbidRequest(req, res) {
		res.send(405);
	}

	if (isWriteOnlyResource) {
		resource.index = resource.show = forbidRequest;
	} else {
		resource.index = findResource;
		resource.show = findResource;
	}

	if (isReadOnlyResource) {
		writeMethodNames.forEach(function(methodName) {
			resource[methodName] = forbidRequest;
		});
	} else {
		resource.new = resource.create = createResource;
		resource.edit = resource.update = updateResource;
		resource.destroy = removeResource;
	}

	return resource;
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

module.exports = Resource;

// index, new, create, show, edit, update, destroy