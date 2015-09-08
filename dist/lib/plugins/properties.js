'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 


properties;var _util = require('../util');var _ = require('lodash');function properties() {
  return (0, _util.functionized)(PropertiesPlugin, [], 'applyPlugin');}


function PropertiesPlugin() {
  // nothing to initialize
}
PropertiesPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;

    // we're basically allowing to define properties and that's it,
    // a very simple plugin
    return { 
      onDefine: this.processDefinitions.bind(this) };}, 



  processDefinitions: function processDefinitions(typeName, defs, prototype) {
    var props = defs.properties || {};

    // properties are just methods with no magic about them
    _.each(props, function (impl, name) {
      prototype[name] = impl;});} };module.exports = exports['default'];
//# sourceMappingURL=../plugins/properties.js.map