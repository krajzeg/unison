let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let views = require('../lib').views;
let sinon = require('sinon');

describe("Views plugin: watch()", () => {
  let $$;
  beforeEach(() => {
    $$ = unison({stuff: {}}).plugin(views());
  });

  it("should bind all methods matching event names as listeners", () => {
    let spies = {childAdded: sinon.spy(), destroyed: sinon.spy()};
    $$('stuff').watch(spies);

    $$('stuff').add({name: "hammer"});
    $$('stuff').destroy();

    assert.ok(spies.childAdded.calledOnce);
    assert.ok(spies.destroyed.calledOnce);
  });

  it("should automatically unbind all listeners when the node is destroyed");
  it("should send a fake 'updated' event after the initial watch()");
});