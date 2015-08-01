let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let client = require('../lib').client;
let relations = require('../lib').relations;
let sinon = require('sinon');

describe("Relations plugin", () => {

  it("should allow introducing and checking relations between objects from both sides", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    alice.now('childOf', bob);

    assert.ok(tom.fatherOf(jerry));
    assert.ok(jerry.childOf(tom));
    assert.ok(bob.fatherOf(alice));
    assert.ok(alice.childOf(bob));
  });

  it("should allow severing relations between objects", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    tom.noLonger('fatherOf', jerry);

    assert.ok(!tom.fatherOf(jerry));
    assert.ok(!jerry.childOf(tom));
  });

  it("should support getting related objects through properly named methods", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    tom.now('fatherOf', alice);

    assert.equal(jerry.father().path(), 'tom');
    assert.equal(alice.father().path(), 'tom');
    assert.deepEqual(_.invoke(tom.children(), 'path'), ['jerry', 'alice']);

    assert.equal(bob.father(), undefined);
    assert.deepEqual(bob.children(), []);
  });

  it("should throw when introducing a relation that's already there", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry');

    tom.now('fatherOf', jerry);
    assert.throws(() => {
      tom.now('fatherOf', jerry);
    });
  });

  it("should throw when severing a relation that's not there", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), bob = u('bob');

    assert.throws(() => tom.noLonger('fatherOf', bob));
  });

  it("should trigger 'updated' events on both sides when relations change", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry');
    let tomSpy = sinon.spy(), jerrySpy = sinon.spy();

    tom.on('updated', tomSpy); jerry.on('updated', jerrySpy);

    tom.now('fatherOf', jerry);
    jerry.noLonger('childOf', tom);

    assert.ok(tomSpy.calledTwice);
    assert.ok(jerrySpy.calledTwice);
  });

  it("should trigger 'now:X' and 'noLonger:x' events when relations change", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry');
    let nowSpy = sinon.spy(), noLongerSpy = sinon.spy();

    tom.on('now:fatherOf', nowSpy);
    jerry.on('noLonger:childOf', noLongerSpy);

    tom.now('fatherOf', jerry);
    tom.noLonger('fatherOf', jerry);

    assert.ok(nowSpy.calledOnce);
    assert.ok(noLongerSpy.calledOnce);
    assert.equal(nowSpy.firstCall.args[0].path(), 'jerry');
    assert.equal(noLongerSpy.firstCall.args[0].path(), 'tom');
  });

  it("should send correct commands when relations are introduced and severed", () => {
    let server = require('../lib').server;
    let comm = new (require('./mocks/server-comm'))();
    let u = unison({
      tom: {}, jerry:{}
    });
    u.plugin(server({communication: comm}));
    u.plugin(relations([{AtoB: 'likes', BtoA: 'likedBy', Bs: 'liked', As: 'likers'}]));

    comm.attach('test');

    u('tom').now('likes', u('jerry'));
    u('jerry').noLonger('likedBy', u('tom'));

    assert.deepEqual(comm.messagesSentTo('test')[1],
      ['c', 'now', 'tom', ['likes', {_u: 'jerry'}]]
    );
    assert.deepEqual(comm.messagesSentTo('test')[2],
      ['c', 'noLonger', 'jerry', ['likedBy', {_u: 'tom'}]]
    );
  });

  it("should support 1:1 relations");
  it("should support 1:n relations");
  it("should support m:n relations");
  it("should automatically sever an old n:1 or 1:1 relation when a new '1' is introduced");
});

function prepareUnisonInstance(rels) {
  let u = unison({
    tom: {}, jerry: {}, bob: {}, alice: {}
  });
  u.plugin(relations(rels));
  return u;
}
