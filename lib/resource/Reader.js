var $injector = require('../Injector'),
	fs = require('fs'),
	path = require('path');


function ResourceReader(Resource) {
	function loadResource(basePath, filename) {
		var resourcePath = path.join(basePath, filename);

		if (!fs.existsSync(resourcePath + '.js')) {
			console.error('Resource not found: ' + resourcePath);
			return false;
		}

		return require(resourcePath);
	}

	function loadResources(resourcesToLoad) {
		var resources = [];

		if (!resourcesToLoad.length) {
			return resources;
		}

		/**
		 * Array of:
		 * {
		 * 		path: '/foo/bar/resources',
		 * 		list: ['Resource', 'Names']
		 * }
		 */
		resourcesToLoad.forEach(function(group) {
			group.list.forEach(function(name) {
				var resource = loadResource(this.path, name);

				if (resource) {
					resources.push(new Resource(resource));
				}
			}, group);
		});

		return resources;
	}

	return {
		getResources: loadResources
	};
}

$injector.provide('ResourceReader', ResourceReader);