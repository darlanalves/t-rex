var $injector = require('./Injector'),
	Registry = $injector.get('Registry');

$injector
	.value('ResourceRegistry', new Registry())
//	.value('DispatcherRegistry', new Registry());