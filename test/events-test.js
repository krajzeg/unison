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

  it("should be executed in order of priority, if specified", () => {
    let u = unison({});
    let value = 1;
    u('').on('updated', (evt) => { value *= evt.snapshot.get.number }); // default priority, 0
    u('').on('updated', (evt) => { value += evt.snapshot.get.number }, {priority: -3}); // run first
    u('').on('updated', (evt) => { value -= evt.snapshot.get.number }, {priority: 5});  // run last

    u('').update({number: 3});

    assert.equal(value, 9);
  });
});

describe("Event objects passed to listeners", () => {
  it("should have a correct 'name' and 'source' property", () => {
    let u = unison({bird: {}}), callback = sinon.spy();
    u('bird').on('updated', callback);

    u('bird').update({flying: true});

    assert.ok(callback.called);
    let event = callback.firstCall.args[0];
    assert.equal(event.name, 'updated');
    assert.equal(event.timestamp, 1);
    assert.equal(event.source.path(), 'bird');
  });

  it("should provide snapshots of the source state at event time", () => {
    let u = unison({bird: {}}), callback = sinon.spy();
    u('bird').on('updated', callback);

    u('bird').update({flying: true});
    u('bird').update({flying: false});

    assert.ok(callback.calledTwice);
    let firstEvent = callback.firstCall.args[0], secondEvent = callback.secondCall.args[0];
    assert.equal(firstEvent.timestamp, 1);
    assert.equal(secondEvent.timestamp, 2);
    assert.equal(firstEvent.snapshot.get.flying, true);
    assert.equal(secondEvent.snapshot.get.flying, false);
    assert.equal(firstEvent.source.get.flying, false);
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

  it("a correct 'destroying' and 'destroyed' event should trigger on the child", () => {
    let spy1 = sinon.spy(), spy2 = sinon.spy();

    u('food.apple.seed.inside').on('destroying', spy1);
    u('food.apple.seed.inside').on('destroyed', spy2);
    u('food.apple.seed.inside').destroy();

    assert.ok(spy1.calledOnce);
    assert.ok(spy2.calledOnce);
  });

  it("'destroying' events should trigger while the object still exists", () => {
    let state, snapshotState;
    u('food.apple.seed').on('destroying', (evt) => {
      state = evt.source.get; snapshotState = evt.snapshot.get;
    });

    u('food.apple.seed').destroy();

    assert.ok(state && state.inside);
    assert.ok(snapshotState && snapshotState.inside);
  });

  it("'destroyed' events should trigger when the object is already removed", () => {
    let state = "listener not called", snapshotState = "listener not called";
    u('food.apple.seed').on('destroyed', (evt) => {
      state = evt.source.get; snapshotState = evt.snapshot.get;
    });

    u('food.apple.seed').destroy();

    assert.strictEqual(state, undefined);
    assert.strictEqual(snapshotState, undefined);
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