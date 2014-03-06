var $injector = require('../Injector'),
	forEach = require('foreach');

function checkValidationErrors(error, request, response, next) {
	if (!error) next();

	if (error.name === 'ValidationError') {
		var errors = {};

		forEach(error.errors, function(error, path) {
			errors[path] = error.message;
		});

		response.data({
			errors: errors
		});
	}


	next();
}

$injector.value('PostProcessors', [
	checkValidationErrors
]);