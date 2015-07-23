'use strict';var _ = require('lodash');
var BaseUnison = require('./base');
var functionize = require('./util').functionize;

// the base functionality
function unison(initialState, options) {
  var base = new BaseUnison(initialState, options);
  var unison = functionize(
  base, 'grab', ['grab']);


  unison.plugin = addPlugin;

  return unison;}


// bundle base and plugins together
module.exports = unison;
module.exports.server = require('./plugins/server');
module.exports.client = require('./plugins/client');

// ===========================

function addPlugin(plugin) {var _this = this;
  var additions = plugin(this) || {};

  _.each(additions.methods || {}, function (method, name) {
    _this[name] = method;});


  _.each(additions.nodeMethods || {}, function (method, name) {
    _this.base._nodeBase[name] = method;});


  return this;}
//# sourceMappingURL=index.js.map