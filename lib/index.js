var _ = require('lodash');
var BaseUnison = require('./base');
var functionized = require('./util').functionized;

// creates a new Unison function-object hybrid
function unison(initialState, options) {
  return functionized(BaseUnison, [initialState, options], 'grab');
}

// bundle base and plugins together
module.exports = unison;
module.exports.server = require('./plugins/server');
module.exports.client = require('./plugins/client');
module.exports.views  = require('./plugins/views');
module.exports.relations = require('./plugins/relations');
module.exports.templates = require('./plugins/templates');
module.exports.rng = require('./plugins/rng');
module.exports.properties = require('./plugins/properties');

module.exports.UserError = require('./errors/user-error.js');
