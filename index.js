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

$injector.load([
	'PreProcessors',
	'PostProcessors',
	'Request',
	'Response'
]).from(__dirname + '/lib/dispatcher/');

require('./lib/Bootstrap');

module.exports = function createServer() {
	return $injector.get('Application');
};