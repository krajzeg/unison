'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 







Unison;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _util = require('./util');var _immutableStates = require('./immutable-states');var _events3 = require('./events');var _events4 = _interopRequireDefault(_events3); // Main Unison object.
// Uses classical instead of ES6 classes to allow Unison.apply(...) down the road.
var _ = require('lodash');function Unison() {var initialState = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];this._events = new _events4['default'](this);
  this._states = { 0: _.extend(initialState, { _t: 'Root', _nextId: 1 }) };
  this._current = 0;

  this.config = _.defaults(options, { 
    backlogSize: 1000 });


  // this is a space for additional private state kept by the server/client
  // intended for objects with methods and other non-JSON-serializable stuff
  this.privates = {};

  // nodes in the Unison state can have different class-like types
  // Node is the master-type that they all inherit from, and can be used
  // to add capabilities to all nodes
  this.types = {};
  this.types.Node = { name: 'Node', definitions: {}, proto: Object.create(UnisonNode.prototype) };
  this.types.Root = { name: 'Root', definitions: { extend: 'Node' }, extend: this.types.Node, proto: Object.create(this.types.Node.proto) };

  // machinery behind the 'define' call
  this.onDefineCallbacks = [];}


Unison.prototype = { 
  grab: function grab() {var path = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];var time = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
    if (time !== undefined && !this._states[time]) 
    throw 'Can\'t create a snapshot at time ' + time + ' - no state recorded for that timestamp.';

    // determine what prototype to use for this node
    // node with a '_t' property will get the type named by it
    // nodes with no '_t' property and non-existent nodes will just get Node
    var nodeState = path ? _.get(this.stateAt(time), path) : this.stateAt(time);
    var nodeType = nodeState && nodeState._t || 'Node';
    if (!this.types[nodeType]) 
    throw new Error('Node \'' + path + '\' proclaims it is of type \'' + nodeType + '\', but no such type is known.');

    var node = Object.create(this.types[nodeType].proto);
    UnisonNode.apply(node, [this, path, time]);
    return node;}, 


  currentState: function currentState() {
    return this._states[this._current];}, 


  currentTime: function currentTime() {
    return this._current;}, 


  stateAt: function stateAt(time) {
    return time !== undefined ? this._states[time] : this._states[this._current];}, 


  applyChange: function applyChange(path, changedProperties) {var deletedProperties = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];
    var changedState = (0, _immutableStates.stateWithUpdate)(this.currentState(), path, changedProperties, deletedProperties);
    this._states[++this._current] = changedState;

    var backlogSize = this.config.backlogSize;
    if (backlogSize && this._current >= backlogSize) 
    delete this._states[this._current - backlogSize];}, 


  listen: function listen() {var _events;return (_events = this._events).listen.apply(_events, arguments);}, 
  unlisten: function unlisten() {var _events2;return (_events2 = this._events).unlisten.apply(_events2, arguments);}, 

  collectEvents: function collectEvents(path, directEvent) {var _this = this;var acc = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
    var object = _.get(this.currentState(), path);

    acc.push([path, directEvent]);
    _.each(object, function (child, id) {
      if (typeof child === 'object' && !(child instanceof Array)) {
        // that's a child, trigger childAdded and recurse into it
        _this.collectEvents((0, _util.childPath)(path, id), directEvent, acc);}});



    return acc;}, 


  nextId: function nextId() {
    var id = this.currentState()._nextId++;
    return id.toString();}, 


  registerGlobalProperties: function registerGlobalProperties(props) {
    _.extend(this, props);}, 


  registerNodeProperties: function registerNodeProperties(props) {
    _.extend(this.types.Node.proto, props);}, 


  applyNodeWrappers: function applyNodeWrappers(wrappers) {var _this2 = this;
    _.each(wrappers, function (outerFn, methodName) {
      _this2.types.Node.proto[methodName] = (0, _util.wrapFunction)(outerFn, _this2.types.Node.proto[methodName]);});}, 



  applyGlobalWrappers: function applyGlobalWrappers(wrappers) {var _this3 = this;
    _.each(wrappers, function (outerFn, methodName) {
      _this3[methodName] = (0, _util.wrapFunction)(outerFn, _this3[methodName]);});}, 




  type: function type(name) {
    if (!this.types[name]) {
      // create the type object
      this.types[name] = { 
        name: name, 
        extend: this.types.Node, 
        definitions: { extend: 'Node' }, 
        proto: Object.create(this.types.Node.proto) };


      // create a spawner function for easy adding of typed objects
      this[name] = function () {var properties = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        return _.extend(properties, { _t: name });};}


    return this.types[name];}, 


  // Defines something about a chosen type (or all nodes). What exactly can be defined depends on the added plugins.
  // Server and client plugins allow you to define 'commmands' and 'intents'. The relations plugin adds 'relations'.
  define: function define(typeOrDefinitions, definitions) {
    // determine arguments (either define({...}) or define('Type', {...}))
    var typeName = undefined;
    if (!definitions) {
      if (typeof typeOrDefinitions == 'string') {
        typeName = typeOrDefinitions;definitions = {};} else 
      {
        typeName = 'Node';definitions = typeOrDefinitions;}} else 

    {
      typeName = typeOrDefinitions;}


    // grab the type object
    var typeObj = this.type(typeName);

    // go through the standard processing
    this.processDefinitions(typeName, definitions, typeObj.proto);

    // go through all plugins that process definitions
    _.each(this.onDefineCallbacks, function (callback) {
      callback(typeName, definitions, typeObj.proto);});


    // store the definitions in case a plugin appears later that would want them
    // we make sure that array/object-like properties get merged instead of overwritten
    _.each(definitions, function (newlyDefined, name) {
      var existing = typeObj.definitions[name];
      if (existing instanceof Array) {
        typeObj.definitions[name] = existing.concat(newlyDefined);} else 
      if ((0, _util.isObject)(existing)) {
        typeObj.definitions[name] = _.extend({}, existing, newlyDefined);} else 
      {
        typeObj.definitions[name] = newlyDefined;}});}, 




  plugin: function plugin(pluginFn) {var _this4 = this;
    var options = pluginFn(this) || {};
    this.registerGlobalProperties(options.methods || {});
    this.registerNodeProperties(options.nodeMethods || {});
    this.applyGlobalWrappers(options.methodWrappers || {});
    this.applyNodeWrappers(options.nodeMethodWrappers || {});

    if (options.name) {
      this.plugins = this.plugins || {};
      this.plugins[options.name] = pluginFn;}


    if (options.onDefine) {(function () {var 
        onDefine = options.onDefine;
        // apply existing definitions
        _.each(_this4.types, function (type, typeName) {return onDefine(typeName, type.definitions, type.proto);});
        // make sure future definitions are picked up
        _this4.onDefineCallbacks.push(onDefine);})();}


    return this;}, 


  // Standard handling of type definitions, only 'extend' for now.
  processDefinitions: function processDefinitions(typeName, definitions, prototypes) {
    // set up extension relations
    var extend = definitions.extend;
    if (extend) {
      var child = this.type(typeName), _parent = this.type(extend);
      child['extends'] = _parent;
      prototype.__proto__ = _parent.proto;}} };var 




UnisonNode = (function () {
  function UnisonNode(unison, path) {var time = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];_classCallCheck(this, UnisonNode);
    this.u = unison;
    this._path = path;
    this._time = time; // undefined means 'always use current state'
  }

  // === Properties of this node
  _createClass(UnisonNode, [{ key: 'path', value: 
    function path() {
      return this._path;} }, { key: 'type', value: 


    function type() {
      var typeName = this.get && this.get._t || 'Node';
      return this.u.type(typeName);} }, { key: 'types', value: 


    function types() {
      var types = [this.type()];
      var type = types[0];
      while (type.extend) {
        type = type.extend;
        types.push(type);}

      return types;} }, { key: 'isA', value: 


    function isA(typeName) {
      var types = this.types();
      return types.filter(function (t) {return t.name == typeName;}).length > 0;} }, { key: 'id', value: 


    function id() {
      return (0, _util.idFromPath)(this.path());}


    // === Retrieving and interacting with other, related nodes
  }, { key: 'root', value: 
    function root() {
      return this.u.grab('', this._time);} }, { key: 'parent', value: 


    function parent() {
      return this.u.grab((0, _util.parentPath)(this.path()), this._time);} }, { key: 'child', value: 


    function child(id) {
      return this.u.grab((0, _util.childPath)(this.path(), id), this._time);} }, { key: 'is', value: 


    function is(otherNode) {
      return otherNode && this._path == otherNode._path;} }, { key: 'children', value: 


    function children() {var _this5 = this;
      var children = [];
      _.each(this.get, function (obj, id) {
        if ((0, _util.isObject)(obj)) 
        children.push(_this5.child(id));});

      return children;} }, { key: 'find', value: 


    function find(subpath) {
      if (this._path) 
      return this.u(this._path + '.' + subpath, this._time);else 

      return this.u(subpath, this._time);}


    // === Timestamp-related operations
  }, { key: 'at', value: 
    function at(time) {
      return this.u.grab(this._path, time);} }, { key: 'timestamp', value: 


    function timestamp() {
      return this._time;}


    // === Retrieving state
  }, { key: 'state', value: 
    function state() {
      if (this._path === '') {
        return this.u.stateAt(this._time);} else 
      {
        return _.get(this.u.stateAt(this._time), this._path);}} }, { key: 'update', value: 







    function update(props) {
      this.ensureCurrent();
      this.u.applyChange(this._path, props);
      this.trigger('updated');} }, { key: 'add', value: 


    function add() {
      var unison = this.u;

      // extract arguments (either (child) or (id, child))
      var id = undefined, child = undefined;for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      if (args.length == 2) {
        id = args[0];child = args[1];} else 
      {
        child = args[0];
        id = unison.nextId();}


      // sanity checks
      this.ensureCurrent();
      var state = this.state();
      expectObject(state, 'Can\'t add child at ' + this._path);
      if (state[id] !== undefined) {
        throw new Error('Can\'t add child \'' + id + '\' at ' + this._path + ' - it already exists.');}

      validateId(id);

      // add it
      this.u.applyChange(this._path, _defineProperty({}, id, child));

      // trigger events
      var pathToChild = (0, _util.childPath)(this.path(), id);
      unison._events.triggerAll(unison.collectEvents(pathToChild, 'created'));

      // return the node for the new child
      return this.child(id);} }, { key: 'remove', value: 


    function remove(id) {
      // sanity checks
      this.ensureCurrent();
      var state = this.state();
      expectObject(state, 'Can\'t remove child at ' + this._path);
      if (state[id] === undefined) {
        throw new Error('Can\'t remove child \'' + id + '\' at ' + this._path + ' - no such object exists.');}


      // store events for later, as the object themselves will disappear
      var pathToChild = (0, _util.childPath)(this._path, id);
      var preEvents = this.u.collectEvents(pathToChild, 'destroying');
      var postEvents = this.u.collectEvents(pathToChild, 'destroyed');

      // remove the object, triggering events along the way
      this.u._events.triggerAll(preEvents);
      this.u.applyChange(this._path, {}, [id]);
      this.u._events.triggerAll(postEvents);

      // done
      return true;} }, { key: 'destroy', value: 


    function destroy() {
      // straightforward translation
      expectObject(this.state(), "Can't destroy ${this._path}");
      return this.parent().remove(this.id());} }, { key: 'on', value: 


    function on(event, callback, options) {
      this.u._events.listen(this._path, event, callback, options);} }, { key: 'off', value: 


    function off(event, callback) {
      this.u._events.unlisten(this._path, event, callback);} }, { key: 'onAny', value: 


    function onAny(event, callback, options) {
      this.u._events.listen((0, _util.childPath)(this._path, '**'), event, callback, options);} }, { key: 'offAny', value: 


    function offAny(event, callback) {
      this.u._events.unlisten((0, _util.childPath)(this._path, '**'), event, callback);} }, { key: 'onChild', value: 


    function onChild(event, callback, options) {
      this.u._events.listen((0, _util.childPath)(this._path, '*'), event, callback);} }, { key: 'offChild', value: 


    function offChild(event, callback) {
      this.u._events.unlisten((0, _util.childPath)(this._path, '*'), event, callback, options);} }, { key: 'trigger', value: 


    function trigger(event, payload) {
      this.u._events.trigger(this._path, event, payload);} }, { key: 'ensureCurrent', value: 


    function ensureCurrent() {
      if (this._time !== undefined) 
      throw new Error("Destructive operations are only allowed on nodes representing the current state, not a snapshot.");} }, { key: 'get', get: function get() {return this.state();} }]);return UnisonNode;})();



function expectObject(state, msg) {
  if (state === undefined) {
    throw new Error(msg + ' - node does not exist.');}

  if (typeof state != 'object') {
    throw new Error(msg + ' - \'' + state + '\' is not an object.');}}



function validateId(id) {
  if (id == '') throw new Error('IDs have to be non-empty.');
  if (id.indexOf(".") >= 0) throw new Error('IDs cannot contain dots.');}module.exports = exports['default'];
//# sourceMappingURL=base.js.map