'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var views = require('../lib').views;
var sinon = require('sinon');

describe("Views plugin: watch()", function () {
  var $$ = undefined;
  beforeEach(function () {
    $$ = unison({ stuff: {} }).plugin(views());});


  it("should bind all methods matching event names as listeners", function () {
    var spies = { childAdded: sinon.spy(), destroyed: sinon.spy() };
    $$('stuff').watch(spies);

    $$('stuff').add({ name: "hammer" });
    $$('stuff').destroy();

    assert.ok(spies.childAdded.calledOnce);
    assert.ok(spies.destroyed.calledOnce);});


  it("should automatically unbind all listeners when the node is destroyed");
  it("should send a fake 'updated' event after the initial watch()");});
//# sourceMappingURL=views-watch-test.js.map