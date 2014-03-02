function ResourceMapper(resources) {
	var map = {},
		has = {};

	// maps every mode references from schema as "ModelName.field => MappedModel"
	forEach(resources, function(resource, name) {
		var model = resource.model,
			modelName = resource.modelName,
			tree = model.schema.tree,
			virtuals = {
				_id: null
			};

		forEach(model.schema.virtuals, function(v, key) {
			virtuals[key] = null;
		});

		forEach(tree, function(node, key) {
			if (key in virtuals) return;

			if (is.array(node)) {
				node = node[0];
			}

			if (is.hash(node)) {
				has[modelName] = true;
				map[modelName + '.' + key] = node.ref;

				if (!map[modelName]) {
					map[modelName] = [];
				}

				map[modelName].push(key);
			}
		});
	});

	// { 'Consortium.group': 'Group', 'Group.company': 'Company' }
	/**
	 * Right now, the map already has the resource names and the list of properties that are paths to other models
	 * { 'ResourceName': ['foo', 'bar'] }
	 */

	var found;

	do {
		found = false;

		// recursively walks down to map nested resources until there's no more resources to map
		forEach(resources, function(resource, name) {
			var model = resource.model,
				modelName = resource.modelName;

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
	 * Now the map should have a list of nested paths that hold populable models
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

	this.map = map;
}

ResourceMapper.prototype.getMap = function() {
	return this.map;
};

module.exports = ResourceMapper;