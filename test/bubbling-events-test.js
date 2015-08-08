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
    let listenSpy = sinon.spy(), onChildSpy = sinon.spy();
    u.listen('bird.*', 'updated', listenSpy);
    u('bird').onChild('updated', onChildSpy);

    u('bird.wings').update({beating: true});

    assert.ok(listenSpy.calledOnce);
    assert.ok(onChildSpy.calledOnce);
  });

  it("should not trigger for further descendants of X.Y", () => {
    let listenSpy = sinon.spy(), onChildSpy = sinon.spy();
    u.listen('bird.*', 'updated', listenSpy);
    u('bird').onChild('updated', onChildSpy);

    u('bird.wings.left').update({clipped: true});

    assert.ok(!listenSpy.called);
    assert.ok(!onChildSpy.called);
  });

  it("should work correctly for the root object", () => {
    let listenSpy = sinon.spy(), onChildSpy = sinon.spy();
    u.listen('*', 'updated', listenSpy);
    u('').onChild('updated', onChildSpy);

    u('bird').update({soaring: true});

    assert.ok(listenSpy.called);
  });

  it("should not trigger if bubbling was stopped", () => {
    let childSpy = sinon.spy();
    u.listen('bird.wings.*', 'updated', childSpy);
    u.listen('bird.wings.left', 'updated', (evt) => evt.stopBubbling());

    u('bird.wings.left').update({lefter: true});
    u('bird.wings.right').update({righter: true});

    assert.ok(childSpy.calledOnce);
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
    let listenSpy = sinon.spy(), onAnySpy = sinon.spy();
    u.listen('bird.**', 'updated', listenSpy);
    u('bird').onAny('updated', onAnySpy);

    u('bird.wings').update({beating: true});

    assert.ok(listenSpy.calledOnce);
    assert.ok(onAnySpy.calledOnce);
  });

  it("should trigger for further descendants of X.Y", () => {
    let listenSpy = sinon.spy(), onAnySpy = sinon.spy();
    u.listen('bird.**', 'updated', listenSpy);
    u('bird').onAny('updated', onAnySpy);

    u('bird.wings.left').update({clipped: true});
    u('bird.wings.right').update({clipped: true});

    assert.ok(listenSpy.calledTwice);
    assert.ok(onAnySpy.calledTwice);
  });

  it("should trigger when X.Y itself has an event", () => {
    let listenSpy = sinon.spy(), onAnySpy = sinon.spy();
    u.listen('bird.**', 'updated', listenSpy);
    u('bird').onAny('updated', onAnySpy);

    u('bird').update({clipped: true});

    assert.ok(listenSpy.calledOnce);
    assert.ok(onAnySpy.calledOnce);
  });

  it("should work correctly for the root object", () => {
    let listenSpy = sinon.spy(), onAnySpy = sinon.spy();
    u.listen('**', 'updated', listenSpy);
    u('').onAny('updated', onAnySpy);

    u('bird.wings.left').update({length: 30});

    assert.ok(listenSpy.called);
    assert.ok(onAnySpy.called);
  });

  it("should not trigger if bubbling was stopped", () => {
    let childSpy = sinon.spy();
    u.listen('bird.**', 'updated', childSpy);
    u.listen('bird.wings.left', 'updated', (evt) => evt.stopBubbling());

    u('bird.wings.left').update({lefter: true});
    u('bird.wings.right').update({righter: true});

    assert.ok(childSpy.calledOnce);
  });
});

