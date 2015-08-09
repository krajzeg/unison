'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 



views;var _util = require('../util');var _ = require('lodash');function views(options) {
  return (0, _util.functionized)(ViewsPlugin, [options], 'applyPlugin');}


function ViewsPlugin() {}


ViewsPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;
    return { 
      nodeMethods: { 
        watch: watch } };} };





var EVENTS = ['updated', 'destroyed', 'created'];

function watch(object) {
  // 'this' here will refer to the node .watch() was called on

  var boundListeners = [];
  var node = this;

  // scan all methods of the object looking for matches with event names
  // register all such methods as listeners
  EVENTS.forEach(function (eventName) {
    var method = object[eventName];
    if (method && typeof method == 'function') {
      var listener = method.bind(object);
      node.on(eventName, listener);
      boundListeners.push({ event: eventName, listener: listener });}});



  // when the node we are watching gets destroyed, we want to unbind all those listeners
  // (including the listener that keeps track of it)
  var unbindListener = function unbindListener() {
    _.each(boundListeners, function (_ref) {var event = _ref.event;var listener = _ref.listener;
      node.off(event, listener);});};


  node.on('destroyed', unbindListener);
  boundListeners.push({ event: 'destroyed', listener: unbindListener });}module.exports = exports['default'];
//# sourceMappingURL=../plugins/views.js.map