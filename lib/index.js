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
