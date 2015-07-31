'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 



Unison;function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash'); // Main Unison object.
// Uses classical instead of ES6 classes to allow Unison.apply(...) down the road.
function Unison() {var initialState = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];this._state = initialState;this._nextId = 1;

  this._events = new UnisonEvents();

  // each Unison object has its own pseudo-class for nodes that can be extended by plugins
  this._nodeBase = Object.create(UnisonNode.prototype);
  this._makeNode = function (unison, path) {
    UnisonNode.apply(this, [unison, path]);};

  this._makeNode.prototype = this._nodeBase;}

Unison.prototype = { 
  grab: function grab(path) {
    var Node = this._makeNode;
    return new Node(this, path);}, 


  listen: function listen() {for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}return this._events.listen.apply(this._events, args);}, 
  unlisten: function unlisten() {for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {args[_key2] = arguments[_key2];}return this._events.unlisten.apply(this._events, args);}, 

  collectEvents: function collectEvents(path, directEvent, childEvent) {var _this = this;var acc = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];
    var parent = parentPath(path), id = idFromPath(path);
    var object = _.get(this._state, path);

    acc.push([parent, childEvent, id]);
    acc.push([path, directEvent]);

    _.each(object, function (subchild, id) {
      if (typeof subchild === 'object' && !(subchild instanceof Array)) {
        // that's a child, trigger childAdded and recurse into it
        _this.collectEvents(childPath(path, id), directEvent, childEvent, acc);}});



    return acc;}, 


  nextId: function nextId() {
    return (this._nextId++).toString();}, 


  registerGlobalProperties: function registerGlobalProperties(props) {
    _.extend(this, props);}, 


  registerNodeProperties: function registerNodeProperties(props) {
    _.extend(this._nodeBase, props);}, 


  plugin: function plugin(pluginFn) {
    var additions = pluginFn(this) || {};
    this.registerGlobalProperties(additions.methods || {});
    this.registerNodeProperties(additions.nodeMethods || {});

    return this;} };var 



UnisonEvents = (function () {
  function UnisonEvents() {_classCallCheck(this, UnisonEvents);
    this._listeners = {};}_createClass(UnisonEvents, [{ key: 'key', value: 


    function key(path, event) {
      return path + ':' + event;} }, { key: 'listen', value: 


    function listen(path, event, callback) {
      var key = this.key(path, event);
      var existingListeners = this._listeners[key] || [];
      this._listeners[key] = existingListeners.concat([callback]);} }, { key: 'unlisten', value: 


    function unlisten(path, event, callback) {
      var key = this.key(path, event);
      var listeners = (this._listeners[key] || []).filter(function (cb) {return cb != callback;});
      if (listeners.length == 0) {
        delete this._listeners[key];} else 
      {
        this._listeners[key] = listeners;}} }, { key: 'trigger', value: 



    function trigger(path, event) {for (var _len3 = arguments.length, payload = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {payload[_key3 - 2] = arguments[_key3];}
      var key = this.key(path, event);
      var listeners = this._listeners[key] || [];
      listeners.map(function (listener) {
        try {
          listener.apply(null, payload);} 
        catch (e) {
          console.error('Error in listener in response to ' + path + '|' + event);
          console.error(e.stack || e);}});} }, { key: 'triggerAll', value: 




    function triggerAll(events) {var _this2 = this;
      _.each(events, function (event) {
        _this2.trigger.apply(_this2, event);});} }]);return UnisonEvents;})();var 




UnisonNode = (function () {
  function UnisonNode(unison, path) {_classCallCheck(this, UnisonNode);
    this.u = unison;
    this._path = path;}_createClass(UnisonNode, [{ key: 'path', value: 


    function path() {
      return this._path;} }, { key: 'id', value: 


    function id() {
      return idFromPath(this.path());} }, { key: 'parent', value: 


    function parent() {
      return this.u.grab(parentPath(this.path()));} }, { key: 'child', value: 


    function child(id) {
      return this.u.grab(childPath(this.path(), id));} }, { key: 'state', value: 


    function state() {
      if (this._path === '') {
        return this.u._state;} else 
      {
        return _.get(this.u._state, this._path);}} }, { key: 'update', value: 







    function update(props) {
      var state = this.state();
      if (state === undefined) return;

      _.extend(state, props);
      this.u._events.trigger(this._path, 'updated');} }, { key: 'add', value: 


    function add() {
      var unison = this.u;

      // extract arguments (either (child) or (id, child))
      var id = undefined, child = undefined;for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {args[_key4] = arguments[_key4];}
      if (args.length == 2) {
        id = args[0];child = args[1];} else 
      {
        child = args[0];
        id = unison.nextId();}


      // sanity checks
      var state = this.state();
      expectObject(state, 'Can\'t add child at ' + this._path);
      if (state[id] !== undefined) {
        throw new Error('Can\'t add child \'' + id + '\' at ' + this._path + ' - it already exists.');}


      // add it
      state[id] = child;

      // trigger events
      var pathToChild = childPath(this.path(), id);
      unison._events.triggerAll(unison.collectEvents(pathToChild, 'created', 'childAdded'));

      // return the path to the newly created child
      return pathToChild;} }, { key: 'remove', value: 


    function remove(id) {
      var unison = this.u;
      var state = this.state();

      // sanity checks
      expectObject(state, 'Can\'t remove child at ' + this._path);

      // does it even exist?
      if (state[id] === undefined) {
        return false;}


      // store events for later, as the object themselves will disappear
      var pathToChild = childPath(this._path, id);
      var events = unison.collectEvents(pathToChild, "destroyed", "childRemoved");

      // remove the object
      delete state[id];

      // trigger the events
      unison._events.triggerAll(events);

      // done
      return true;} }, { key: 'destroy', value: 


    function destroy() {
      // straightforward translation
      expectObject(this.state(), "Can't destroy ${this._path}");
      return this.parent().remove(this.id());} }, { key: 'on', value: 


    function on(event, callback) {
      this.u._events.listen(this._path, event, callback);} }, { key: 'off', value: 


    function off(event, callback) {
      this.u._events.unlisten(this._path, event, callback);} }, { key: 'trigger', value: 


    function trigger(event) {var _u$_events;for (var _len5 = arguments.length, payload = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {payload[_key5 - 1] = arguments[_key5];}
      (_u$_events = this.u._events).trigger.apply(_u$_events, [this._path, event].concat(payload));} }, { key: 'get', get: function get() {return this.state();} }]);return UnisonNode;})();



function expectObject(state, msg) {
  if (state === undefined) {
    throw new Error(msg + ' - node does not exist.');}

  if (typeof state != 'object') {
    throw new Error(msg + ' - \'' + state + '\' is not an object.');}}



function idFromPath(path) {
  if (path === '') {
    throw new Error('The root object has no id.');} else 
  {
    return _.last(path.split("."));}}



function parentPath(path) {
  if (path === '') {
    throw new Error('The root object has no parent.');} else 
  {
    var pathElements = path.split(".");
    return pathElements.
    slice(0, pathElements.length - 1).
    join(".");}}



function childPath(path, id) {
  if (path == '') 
  return id;else 

  return [path, id].join('.');}module.exports = exports['default'];
//# sourceMappingURL=base.js.map