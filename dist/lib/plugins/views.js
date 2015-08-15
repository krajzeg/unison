'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 




views;var _util = require('../util');var _taskQueues = require('../task-queues');var _ = require('lodash');function views(options) {
  return (0, _util.functionized)(ViewsPlugin, [options], 'applyPlugin');}


function ViewsPlugin() {
  this.animationQueue = new _taskQueues.Queue();
  this.registeredViews = {};}

ViewsPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;
    return { 
      name: 'views', 
      methods: { 
        animation: this.animation.bind(this) }, 

      nodeMethods: { 
        watch: watch, 

        registerView: registerView, 
        view: view } };}, 




  animation: function animation(fn) {
    var synced = this.animationQueue.synchronize(fn);
    synced._animation = true;
    return synced;} };



function watch(object, events) {var _this = this;
  // 'this' here will refer to the node .watch() was called on

  var boundListeners = [];
  var node = this;

  // apply all the requested listeners
  _.each(events, function (method, event) {
    var listener = method.bind(object);

    if (!listener._animation) 
    listener = _this.u.animation(listener);

    node.on(event, listener);
    boundListeners.push({ event: event, listener: listener });});


  // when the node we are watching gets destroyed, we want to unbind all those listeners
  // (including the listener that keeps track of it)
  var unbindListener = function unbindListener() {
    _.each(boundListeners, function (_ref) {var event = _ref.event;var listener = _ref.listener;
      node.off(event, listener);});};


  node.on('destroyed', unbindListener);
  boundListeners.push({ event: 'destroyed', listener: unbindListener });}


function registerView(viewObject) {
  var views = this.u.plugins.views, path = this.path();
  views.registeredViews[path] = viewObject;
  this.on('destroyed', function () {
    delete views.registeredViews[path];});}



function view() {
  return this.u.plugins.views.registeredViews[this.path()];}module.exports = exports['default'];
//# sourceMappingURL=../plugins/views.js.map