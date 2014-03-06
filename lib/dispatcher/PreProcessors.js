var $injector = require('../Injector'),
	express = require('express');

/*	json = express.json(),
	urlencoded = express.urlencoded(),
	_multipart = express.multipart();

function parseJson(err, req, res, next) {
	if (err) return next(err);

	try {
		json(req.originalRequest, res.originalResponse, next);
	} catch (e) {
		console.log('JSON error', e);
		next(e);
	}
}

function parseFormData(err, req, res, next) {
	if (err) return next(err);

	urlencoded(req.originalRequest, res.originalResponse, next);
}

function multipart(err, req, res, next) {
	if (err) return next(err);

	_multipart(req.originalRequest, res.originalResponse, next);
}


function verifyJsonErrors(err, req, res, next) {
	if (err) {
		res.status(400).data('Invalid JSON');
		return next('route');
	}

	next();
}*/

var getRawBody = require('raw-body');

function verifyIncomingFormat(err, req, res, next) {
	var originalRequest = req.originalRequest;

	if (!originalRequest.is('json')) {
		res.header('Accept', 'application/json');
		res.status(406);

		next();
	}

	getRawBody(originalRequest, {
		length: originalRequest.headers['content-length'],
		limit: '1mb',
		encoding: 'utf8'
	}, function(err, string) {
		if (err) {
			return next(err);
		}

		try {
			req.params(JSON.parse(string));
		} catch (e) {
			res.status(400).error(new Error('Invalid JSON'));
		}

		next();
	});
}

$injector.value('PreProcessors', [
	/*parseJson,
	verifyJsonErrors,
	parseFormData,
	multipart,*/
	verifyIncomingFormat
]);