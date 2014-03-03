var $injector = require('../Injector');

function ResourceDestroyer() {
	return {
		removeOne: removeOne
	};

	function removeOne(objectId) {
		return Model.findByIdAndRemove(objectId).exec()
	}

}

$injector.provide('ResourceDestroyer', ResourceDestroyer);