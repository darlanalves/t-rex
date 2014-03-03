function Resource(config) {
	var name = config.name || '';

	this.schema = config.schema;
	this.name = name;
	this.modelName = config.modelName || name;
	this.collectionName = config.collectionName || name;
	this.readOnly = !! config.readOnly;
	this.writeOnly = !! config.writeOnly;
	this.parent = config.parent || null;
}

module.exports = Resource;
$injector.value('Resource', Resource);