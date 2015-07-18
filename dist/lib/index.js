'use strict';var _ = require('lodash');
var BaseUnison = require('./base');
var functionize = require('./util').functionize;

module.exports = { 
  local: function local(initialState, options) {
    var base = new BaseUnison(initialState, options);
    var unison = functionize(
    base, 'grab', ['grab']);


    unison.plugin = addPlugin;

    return unison;} };



// ===========================

function addPlugin(plugin) {var _this = this;
  var additions = plugin(this) || {};

  _.each(additions.methods || {}, function (method, name) {
    console.log(_this);
    _this[name] = method;});


  _.each(additions.nodeMethods || {}, function (method, name) {
    _this.base._nodeBase[name] = method;});}
//# sourceMappingURL=index.js.map