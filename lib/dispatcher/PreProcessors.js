var $injector = require('../Injector'),
	express = require('express'),
	json = express.json(),
	urlencoded = express.urlencoded(),
	_multipart = express.multipart();

/*function parseJson(err, req, res, next) {
	if (err) return next(err);

	try {
		json(req.request, res.response, next);
	} catch (e) {
		console.log('JSON error', e);
		next(e);
	}
}

function parseFormData(err, req, res, next) {
	if (err) return next(err);

	urlencoded(req.request, res.response, next);
}

function multipart(err, req, res, next) {
	if (err) return next(err);

	_multipart(req, res, next);
}


function verifyJsonErrors(err, req, res, next) {
	if (err) {
		res.status(400).data('Invalid JSON');
		return next('route');
	}

	next();
}*/

function verifyIncomingFormat(err, req, res, next) {
	if (!req.is('json')) {
		res.header('Accept', 'application/json');
		res.status(406);

		next();
	}

	next();
}

$injector.value('PreProcessors', [
	/*	parseJson,
	verifyJsonErrors,
	parseFormData,
	multipart,*/
	verifyIncomingFormat
]);