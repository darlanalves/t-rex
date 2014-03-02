var errors = require('../Errors');

function ResourceDestroyer() {

}

ResourceDestroyer.prototype = {
	constructor: ResourceDestroyer,

	removeOne: removeOne
};


function removeOne(Model, modelId, req, res) {
	Model.findByIdAndRemove(modelId).exec(function(err) {
		if (err) {
			res.send(500);
			return;
		}

		res.send(200);
	});
}