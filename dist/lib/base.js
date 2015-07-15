'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');var 


Unison = (function () {
  function Unison() {var initialState = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];_classCallCheck(this, Unison);
    this._state = initialState;
    this._nextId = 1;}_createClass(Unison, [{ key: 'grab', value: 


    function grab(path) {
      return new UnisonNode(this, path);} }, { key: 'trigger', value: 


    function trigger(path, event) {} }, { key: 'nextId', value: 



    function nextId() {
      return this._nextId++;} }]);return Unison;})();exports['default'] = Unison;var 




UnisonNode = (function () {
  function UnisonNode(unison, path) {_classCallCheck(this, UnisonNode);
    this._unison = unison;
    this._path = path;}_createClass(UnisonNode, [{ key: 'path', value: 


    function path() {
      return this._path;} }, { key: 'state', value: 


    function state() {
      if (this._path === '') {
        return this._unison._state;} else 
      {
        return _.get(this._unison._state, this._path);}} }, { key: 'update', value: 



    function update(props) {
      var state = this.state();
      if (state === undefined) return;

      _.extend(state, props);
      this._unison.trigger(this._path, 'updated');} }, { key: 'add', value: 


    function add() {
      // extract arguments (either (child) or (id, child))
      var id = undefined, child = undefined;for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {args[_key] = arguments[_key];}
      if (args.length == 2) {
        id = args[0];child = args[1];} else 
      {
        child = args[0];
        id = this._unison.nextId();}


      // sanity checks
      var state = this.state();
      expectObject(state, 'Can\'t add child at ' + this.path);
      if (state[id] !== undefined) {
        throw new Error('Can\'t add child \'' + id + '\' at ' + this._path + ' - it already exists.');}


      // add it
      state[id] = child;

      // trigger events
      var childPath = [this._path, id].join('.');
      this._unison.trigger(this._path, 'childAdded', id);
      this._unison.trigger(childPath, 'created');

      // return the path to the newly created child
      return childPath;} }, { key: 'remove', value: 


    function remove(id) {
      var state = this.state();

      // sanity checks
      expectObject(state, 'Can\'t remove child at ' + this.path);

      // does it even exist?
      if (state[id] === undefined) {
        return false;}


      // it does, let's remove it
      delete state[id];

      // trigger events
      var childPath = [this._path, id].join('.');
      this._unison.trigger(this._path, 'childRemoved', id);
      this._unison.trigger(childPath, 'destroyed');

      // done
      return true;} }]);return UnisonNode;})();



function expectObject(state, msg) {
  if (state === undefined) {
    throw new Error(msg + ' - node does not exist.');}

  if (typeof state != 'object') {
    throw new Error(msg + ' - \'' + state + '\' is not an object.');}}module.exports = exports['default']; // nothing for now
//# sourceMappingURL=base.js.map