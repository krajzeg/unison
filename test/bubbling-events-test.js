let assert = require('chai').assert;
let sinon = require('sinon');
let unison = require('../lib');

describe("X.Y.* (single star) wildcard listeners", () => {
  let u;
  beforeEach(() => {
    u = unison({
      bird: {wings: {left: {}, right: {}}}
    });
  });

  it("should be triggered when a child of X.Y has an event", () => {
    let childUpdated = sinon.spy();
    u.listen('bird.*', 'updated', childUpdated);

    u('bird.wings').update({beating: true});

    assert.ok(childUpdated.calledOnce);
  });

  it("should not trigger for further descendants of X.Y", () => {
    let childUpdated = sinon.spy();
    u.listen('bird.*', 'updated', childUpdated);

    u('bird.wings.left').update({clipped: true});

    assert.ok(!childUpdated.called);
  });

  it("should work correctly for the root object", () => {
    let childUpdated = sinon.spy();
    u.listen('*', 'updated', childUpdated);

    u('bird').update({soaring: true});

    assert.ok(childUpdated.called);
  });
});

describe("X.Y.** (double star) wildcard listeners", () => {
  let u;
  beforeEach(() => {
    u = unison({
      bird: {wings: {left: {}, right: {}}}
    });
  });

  it("should be triggered when a child of X.Y has an event", () => {
    let childUpdated = sinon.spy();
    u.listen('bird.**', 'updated', childUpdated);

    u('bird.wings').update({beating: true});

    assert.ok(childUpdated.calledOnce);
  });

  it("should trigger for further descendants of X.Y", () => {
    let descendantUpdated = sinon.spy();
    u.listen('bird.**', 'updated', descendantUpdated);

    u('bird.wings.left').update({clipped: true});
    u('bird.wings.right').update({clipped: true});

    assert.ok(descendantUpdated.calledTwice);
  });

  it("should trigger when X.Y itself has an event", () => {
    let updated = sinon.spy();
    u.listen('bird.**', 'updated', updated);

    u('bird').update({clipped: true});

    assert.ok(updated.calledOnce);
  });

  it("should work correctly for the root object", () => {
    let childUpdated = sinon.spy();
    u.listen('**', 'updated', childUpdated);

    u('bird.wings.left').update({length: 30});

    assert.ok(childUpdated.called);
  });
});

