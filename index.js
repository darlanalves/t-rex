var express = require('express'),
	exresource = require('express-resource'),
	mongooseReady = require('mongoose-ready'),

	Resource = require('./lib/Resource'),
	Application = require('./lib/Application');

function createServer(options) {
	return new Application(express(), mongooseReady(), options);
}

module.exports = {
	createServer: createServer,
	express: express,
	exresource: exresource,
	Resource: Resource
};