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
  if (!object || !events) 
  throw new Error("Please call as u(...).watch(yourObject, {event: method, event: method, ...}).");

  // 'this' here will refer to the node .watch() was called on

  var boundListeners = [];
  var node = this, u = this.u;

  // apply all the requested listeners
  _.each(events, function (method, event) {
    // wrap the listener with queue-synchronizing behavior
    var listener = method.bind(object);
    if (!listener._animation) 
    listener = _this.u.animation(listener);

    // handle wildcard listeners
    var path = node.path();
    if (event.match(/^\*\*:/)) {
      path += '.**';
      event = event.replace('**:', '');}

    if (event.match(/^\*:/)) {
      path += '.*';
      event = event.replace('*:', '');}


    u.listen(path, event, listener);
    boundListeners.push({ path: path, event: event, listener: listener });});


  // when the node we are watching gets destroyed, we want to unbind all those listeners
  // (including the listener that keeps track of it)
  var unbindListener = function unbindListener() {
    _.each(boundListeners, function (_ref) {var path = _ref.path;var event = _ref.event;var listener = _ref.listener;
      u.unlisten(path, event, listener);});};


  node.on('destroyed', unbindListener);
  boundListeners.push({ path: node.path(), event: 'destroyed', listener: unbindListener });}


function registerView(viewObject) {
  var views = this.u.plugins.views, path = this.path();
  views.registeredViews[path] = viewObject;
  this.on('destroyed', function () {
    delete views.registeredViews[path];});}



function view() {
  return this.u.plugins.views.registeredViews[this.path()];}module.exports = exports['default'];
//# sourceMappingURL=../plugins/views.js.map