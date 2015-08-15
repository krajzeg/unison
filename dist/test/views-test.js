'use strict';var _ = require('lodash');
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
      var spies = { updated: sinon.spy(), destroyed: sinon.spy() };
      u('stuff').watch(spies);

      u('stuff').update({ heavy: true });
      u('stuff').destroy();

      assert.ok(spies.updated.calledOnce);
      assert.ok(spies.destroyed.calledOnce);});


    it("should automatically unbind all listeners when the node is destroyed", function () {
      var spies = { updated: sinon.spy() };

      u('stuff').watch(spies);
      u('stuff').destroy();

      u('').add('stuff', {});
      u('stuff').update({ ignored: "very much" });

      assert.ok(!spies.updated.called);});});



  describe("view()", function () {
    it("should let you find views registered earlier with registerObject()", function () {
      var v = {};
      u('stuff').registerView(v);
      assert.equal(u('stuff').view(), v);});


    it("should not find the view after the node was destroyed", function () {
      var v = {};
      u('stuff').registerView(v);
      u('stuff').destroy();
      assert.strictEqual(u('stuff').view(), undefined);});});});
//# sourceMappingURL=views-test.js.map