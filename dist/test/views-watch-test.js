'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var views = require('../lib').views;
var sinon = require('sinon');

describe("Views plugin: watch()", function () {
  var u = undefined;
  beforeEach(function () {
    u = unison({ stuff: {} }).plugin(views());});


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
//# sourceMappingURL=views-watch-test.js.map