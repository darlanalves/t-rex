$injector = require('./lib/Injector');

$injector.load([
	'Registry',
	'Utils',
	'Application',
	'Resource',
	'Dispatcher'
]).from(__dirname + '/lib/');

$injector.load([
	'Destroyer',
	'Finder',
	'Loader',
	'Reader',
	'Mapper',
	'Populator',
	'Writer'
]).from(__dirname + '/lib/resource/');

// from('./lib/dispatch/').load([''])

require('./lib/Bootstrap');

module.exports = function createServer() {
	return $injector.get('Application');
}