let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let views = require('../lib').views;
let sinon = require('sinon');

describe("Views plugin", () => {
  let u;
  beforeEach(() => {
    u = unison({stuff: {}}).plugin(views());
  });

  describe("watch()", () => {
    it("should bind all methods matching event names as listeners", () => {
      let spies = {updated: sinon.spy(), destroyed: sinon.spy()};
      u('stuff').watch(spies);

      u('stuff').update({heavy: true});
      u('stuff').destroy();

      assert.ok(spies.updated.calledOnce);
      assert.ok(spies.destroyed.calledOnce);
    });

    it("should automatically unbind all listeners when the node is destroyed", () => {
      let spies = {updated: sinon.spy()};

      u('stuff').watch(spies);
      u('stuff').destroy();

      u('').add('stuff', {});
      u('stuff').update({ignored: "very much"});

      assert.ok(!spies.updated.called);
    });
  });

  describe("view()", () => {
    it("should let you find views registered earlier with registerObject()", () => {
      let v = {};
      u('stuff').registerView(v);
      assert.equal(u('stuff').view(), v);
    });

    it("should not find the view after the node was destroyed", () => {
      let v = {};
      u('stuff').registerView(v);
      u('stuff').destroy();
      assert.strictEqual(u('stuff').view(), undefined);
    });
  });

});