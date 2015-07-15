'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');var 


Unison = (function () {
  function Unison() {var initialState = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];_classCallCheck(this, Unison);
    this.state = initialState;}_createClass(Unison, [{ key: 'grab', value: 


    function grab(path) {
      return new UnisonNode(this, path);} }, { key: 'trigger', value: 


    function trigger(path, event) {} }]);return Unison;})();exports['default'] = Unison;var 




UnisonNode = (function () {
  function UnisonNode(unison, path) {_classCallCheck(this, UnisonNode);
    this.unison = unison;
    this.path = path;}_createClass(UnisonNode, [{ key: 'state', value: 


    function state() {
      if (this.path === '') {
        return this.unison.state;} else 
      {
        return _.get(this.unison.state, this.path);}} }, { key: 'update', value: 



    function update(props) {
      var state = this.state();
      if (state === undefined) return;

      _.extend(state, props);
      this.unison.trigger(this.path, 'updated');} }]);return UnisonNode;})();module.exports = exports['default']; // nothing for now
//# sourceMappingURL=base.js.map