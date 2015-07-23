var _ = require('lodash');
var BaseUnison = require('./base');
var functionize = require('./util').functionize;

// the base functionality
function unison(initialState, options) {
  let base = new BaseUnison(initialState, options);
  let unison = functionize(
    base, 'grab', ['grab']
  );

  unison.plugin = addPlugin;

  return unison;
}

// bundle base and plugins together
module.exports = unison;
module.exports.server = require('./plugins/server');
module.exports.client = require('./plugins/client');

// ===========================

function addPlugin(plugin) {
  var additions = plugin(this) || {};

  _.each(additions.methods || {}, (method, name) => {
    this[name] = method;
  });

  _.each(additions.nodeMethods || {}, (method, name) => {
    this.base._nodeBase[name] = method;
  });

  return this;
}
