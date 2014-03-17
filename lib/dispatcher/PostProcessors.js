var $injector = require('../Injector'),
	forEach = require('foreach'),
	is = require('is');

function checkValidationErrors(error, request, response, next) {
	if (!error) return next();

	if (error.name === 'ValidationError') {
		var errors = {};

		forEach(error.errors, function(error, path) {
			errors[path] = error.message;
		});

		response.status(400).error(null).data({
			errors: errors
		});

		return next();
	}

	next(error);
}

function dropVersionInfo(error, request, response, next) {
	if (error) return next(error);

	var data = response.data(),
		status = response.status();

	if (status >= 400) {
		return next();
	}

	try {
		if (data) {
			if (!is.array(data)) {
				data = [data];
			}

			data.forEach(function(item) {
				delete item.__v;
			});
		}
	} catch (e) {
		error = e;
	}

	next(error);
}

$injector.value('PostProcessors', [
	checkValidationErrors,
	dropVersionInfo
]);