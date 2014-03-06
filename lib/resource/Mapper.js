var is = require('is'),
	forEach = require('foreach'),
	$injector = require('../Injector');

function ResourceMapper(ResourceRegistry) {
	return {
		buildMap: function() {

			var map = {},
				has = {},
				parentResourceTable = {},
				childrenResources = {};

			// maps every model references from schema as "ModelName.field => MappedModel"
			// also maps the children/parent of a resource (for future nested routing)
			ResourceRegistry.forEach(function(resource) {
				var model = resource.model,
					modelName = resource.modelName,
					resourceName = resource.name,
					resourceParent = resource.parent,
					resourceSchema = resource.schema,
					tree = model.schema.tree,
					ObjectID = 'ObjectID',
					virtuals = {
						_id: null,
						__v: null
					};

				if (resourceParent && resourceName !== resourceParent) {
					parentResourceTable[resourceName] = resourceParent;

					if (!childrenResources[resourceParent]) {
						childrenResources[resourceParent] = [resourceName];
					} else {
						childrenResources[resourceParent].push(resourceName);
					}
				}

				forEach(model.schema.virtuals, function(v, key) {
					virtuals[key] = null;
				});

				resourceSchema.eachPath(function(path, schema) {
					if (path in virtuals || schema.instance !== ObjectID) return;

					has[modelName] = true;
					map[modelName + '.' + path] = schema.options.ref;

					if (!map[modelName]) {
						map[modelName] = [];
					}

					map[modelName].push(path);

				});
			});

			/**
			 * Right now, the map already has the resource names and the list of properties that are paths to other models
			 * { 'ResourceName': ['foo', 'bar'] }
			 */

			var found;

			do {
				/* jshint loopfunc: true */
				found = false;

				// recursively walks down to map nested resources until there's no more resources to map
				ResourceRegistry.forEach(function(resource) {
					var modelName = resource.modelName;

					if (!has[modelName]) return;

					// fields that have models
					forEach(map[modelName], function(field) {
						var parentPath = modelName + '.' + field,
							modelToMap = map[parentPath],
							subPaths = map[modelToMap];

						if (!subPaths) return;

						forEach(subPaths, function(subPath) {
							var newPath = parentPath + '.' + subPath;

							if (!map[newPath]) {
								found = true;
								map[newPath] = map[modelToMap + '.' + subPath];
							}
						});
					});
				});
			} while (found);

			/**
			 * At this point the map should have a list of nested paths that hold populable models
			 * Each level on the path has its own entry, so it's safe to walk down without missing the path steps
			 *
			 * {
			 * 		'Resource': ['foo', 'bar'],
			 * 		'Foo': ['qux']
			 * 		'Foo.qux': 'Qux'
			 * 		'Resource.foo': 'Foo',
			 * 		'Resource.bar': 'Bar',
			 * 		'Resource.foo.qux': 'Qux'
			 * }
			 */

			/**
			 * parentResourceTable {
			 * 		'foo': 'bar',
			 * 		'bar': 'baz'
			 * 		'baz': 'qux'
			 * }
			 *
			 * parentResourceMap {
			 * 		'foo': ['bar', 'baz', 'qux']
			 * }
			 *
			 */
			var parentResourceMap = {};

			ResourceRegistry.forEach(function(resource) {
				var name = resource.name,
					found = name,
					list = [];

				do {
					found = parentResourceTable[found];

					if (found) {
						list.push(found);
					}
				} while (found);

				parentResourceMap[name] = list;
			});

			this.map = map;
			this.parents = parentResourceMap;
			this.children = childrenResources;
		},

		getResource: function(name) {
			return ResourceRegistry.get(name);
		},

		getModelMap: function() {
			return this.map;
		},

		getResourceParents: function(resourceName) {
			return this.parents[resourceName] || [];
		},

		getResourceChildren: function(resourceName) {
			return this.children[resourceName] || [];
		}
	};
};

$injector.provide('ResourceMapper', ResourceMapper);