'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 

views;var _ = require('lodash');function views(options) {
  return function ($$) {return { 
      nodeMethods: { 
        watch: watch } };};}




var EVENTS = ['updated', 'destroyed', 'childAdded', 'childRemoved'];

function watch(object) {
  var boundListeners = [];
  var node = this;

  // scan all methods of the object looking for matches with event names
  // register all such methods as listeners
  EVENTS.forEach(function (eventName) {
    var method = object[eventName];
    if (method && typeof method == 'function') {
      var listener = method.bind(object);
      node.on(eventName, method.bind(object));
      boundListeners.push({ event: eventName, listener: listener });}});



  // when the node we are watching gets destroyed, we want to unbind all those listeners
  // (including the listener that keeps track of it)
  var unbindListener = function unbindListener() {
    _.each(boundListeners, function (_ref) {var event = _ref.event;var listener = _ref.listener;
      node.off(event, listener);});};


  node.on('destroyed', unbindListener);
  boundListeners.push(unbindListener);}module.exports = exports['default'];
//# sourceMappingURL=../plugins/views.js.map