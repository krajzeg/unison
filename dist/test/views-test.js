'use strict';var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var views = require('../lib').views;
var sinon = require('sinon');

describe("Views plugin", function () {
  var u = undefined;
  beforeEach(function () {
    u = unison({ stuff: {} }).plugin(views());});


  describe("watch()", function () {
    it("should bind all methods matching event names as listeners", function () {
      var watcher = new TestWatcher();
      u('stuff').watch(watcher, { 
        updated: watcher.update, 
        destroyed: watcher.destroy });


      u('stuff').update({ heavy: true });
      u('stuff').destroy();

      assert.equal(watcher.updateCount, 1);
      assert.equal(watcher.destroyCount, 1);});


    it("should automatically unbind all listeners when the node is destroyed", function () {
      var watcher = new TestWatcher();

      u('stuff').watch(watcher, { 
        updated: watcher.update });

      u('stuff').destroy();

      u('').add('stuff', {});
      u('stuff').update({ ignored: "very much" });

      assert.equal(watcher.updateCount, 0);});});



  describe("view()", function () {
    it("should let you find views registered earlier with registerObject()", function () {
      var v = {};
      u('stuff').registerView(v);
      assert.equal(u('stuff').view(), v);});


    it("should not find the view after the node was destroyed", function () {
      var v = {};
      u('stuff').registerView(v);
      u('stuff').destroy();
      assert.strictEqual(u('stuff').view(), undefined);});});});var 





TestWatcher = (function () {
  function TestWatcher() {_classCallCheck(this, TestWatcher);
    this.updateCount = this.destroyCount = this.createCount = 0;}_createClass(TestWatcher, [{ key: 'update', value: 

    function update() {this.updateCount++;} }, { key: 'destroy', value: 
    function destroy() {this.destroyCount++;} }, { key: 'create', value: 
    function create() {this.createCount++;} }]);return TestWatcher;})();
//# sourceMappingURL=views-test.js.map