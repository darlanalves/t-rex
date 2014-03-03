var $injector = require('../Injector');

function ResourceDestroyer(mongoose) {
	var ObjectId = mongoose.Schema.Types.ObjectId;

	function removeOne(resource, objectId) {
		return Model.findByIdAndRemove(objectId).exec();
	}

	function removeAll(resource, objectIds) {
		var ids = [];

		objectIds.forEach(function(id) {
			ids.push(new ObjectId(id));
		});

		var condition = {
			_id: {
				$in: ids
			}
		};

		console.log(condition);

		return Comment.remove(condition).exec();
	}

	return {
		removeOne: removeOne
	};
}

$injector.provide('ResourceDestroyer', ResourceDestroyer);