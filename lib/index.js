var _ = require('lodash');
var BaseUnison = require('./base');
var functionize = require('./util').functionize;

// creates a new Unison function-object hybrid
function unison(initialState, options) {
  let base = new BaseUnison(initialState, options);
  return functionize(
    base, 'grab',
    ['grab', 'plugin']
  );
}

// bundle base and plugins together
module.exports = unison;
module.exports.server = require('./plugins/server');
module.exports.client = require('./plugins/client');
module.exports.views  = require('./plugins/views');
