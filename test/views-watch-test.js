let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let views = require('../lib').views;
let sinon = require('sinon');

describe("Views plugin: watch()", () => {
  let u;
  beforeEach(() => {
    u = unison({stuff: {}}).plugin(views());
  });

  it("should bind all methods matching event names as listeners", () => {
    let spies = {childAdded: sinon.spy(), destroyed: sinon.spy()};
    u('stuff').watch(spies);

    u('stuff').add({name: "hammer"});
    u('stuff').destroy();

    assert.ok(spies.childAdded.calledOnce);
    assert.ok(spies.destroyed.calledOnce);
  });

  it("should automatically unbind all listeners when the node is destroyed", () => {
    let spies = {childAdded: sinon.spy()};

    u('stuff').watch(spies);
    u('stuff').destroy();

    u('').add('stuff', {});
    u('stuff').add('psych', {});

    assert.ok(!spies.childAdded.called);
  });
});