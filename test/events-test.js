let assert = require('chai').assert;
let sinon = require('sinon');
let unison = require('../lib');

describe("When objects are updated", () => {
  let u;
  beforeEach(() => {
    u = unison({
      bird: {name: 'eagle'}
    });
  });

  it("events should be triggered once for each update", () => {
    let callback = sinon.spy();

    u('bird').on('updated', callback);
    u('bird').update({wingspan: 12});
    u('bird').update({soaring: 'high'});

    assert.ok(callback.calledTwice);
  });
});

describe("Multiple listeners per event", () => {
  it("should be supported", () => {
    let u = unison({}), spy1 = sinon.spy(), spy2 = sinon.spy();
    u('').on('updated', spy1);
    u('').on('updated', spy2);

    u('').update({hi: 'There'});
    u('').update({another: 'update'});

    assert.ok(spy1.calledTwice);
    assert.ok(spy2.calledTwice);
  });
});

describe("When children are added", () => {
  let u;
  beforeEach(() => {
    u = unison({
      food: {}
    });
  });

  it("a correct 'created' event should trigger on the child", () => {
    let spy = sinon.spy();

    u('food.cucumber').on('created', spy);
    u('food').add('cucumber', {name: 'cucumber'});

    assert.ok(spy.calledOnce);
  });

  it("'created' events should trigger for nested objects", () => {
    let created = sinon.spy(), deepCreated = sinon.spy();

    u('food.apple.seed.inside').on('created', deepCreated);
    u('food.apple.seed.outside').on('created', deepCreated);
    u('food.apple.seed').on('created', created);

    u('food').add('apple', { seed: { inside: {}, outside: {} } });

    assert.ok(created.calledOnce);
    assert.ok(deepCreated.calledTwice);
  });
});

describe("When children are removed", () => {
  let u;
  beforeEach(() => {
    u = unison({
      food: {
        apple: {seed: {inside: {}, outside: {}}}
      }
    });
  });

  it("a correct 'destroyed' event should trigger on the child", () => {
    let spy = sinon.spy();

    u('food.apple.seed.inside').on('destroyed', spy);
    u('food.apple.seed.inside').destroy();

    assert.ok(spy.calledOnce);
  });

  it("'destroyed' events should trigger for nested objects", () => {
    let destroyed = sinon.spy(), deepDestroyed = sinon.spy(), wildcardDestroyed = sinon.spy();

    u('food.apple.seed.inside').on('destroyed', deepDestroyed);
    u('food.apple.seed.outside').on('destroyed', deepDestroyed);
    u('food.apple.seed').on('destroyed', destroyed);
    u.listen('food.apple.seed.*', 'destroyed', wildcardDestroyed);

    u('food.apple').destroy();

    assert.ok(destroyed.calledOnce);
    assert.ok(deepDestroyed.calledTwice);
    assert.ok(wildcardDestroyed.calledTwice);
  });
});