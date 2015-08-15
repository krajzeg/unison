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
      let watcher = new TestWatcher();
      u('stuff').watch(watcher, {
        updated: watcher.update,
        destroyed: watcher.destroy
      });

      u('stuff').update({heavy: true});
      u('stuff').destroy();

      assert.equal(watcher.updateCount, 1);
      assert.equal(watcher.destroyCount, 1);
    });

    it("should automatically unbind all listeners when the node is destroyed", () => {
      let watcher = new TestWatcher();

      u('stuff').watch(watcher, {
        updated: watcher.update
      });
      u('stuff').destroy();

      u('').add('stuff', {});
      u('stuff').update({ignored: "very much"});

      assert.equal(watcher.updateCount, 0);
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


class TestWatcher {
  constructor() {
    this.updateCount = this.destroyCount = this.createCount = 0;
  }
  update() { this.updateCount++; }
  destroy() { this.destroyCount++; }
  create() { this.createCount++; }
}