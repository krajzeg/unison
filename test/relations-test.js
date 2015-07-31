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

  it("should allow getting one related object if there is one");
  it("should allow listing related objects if there are many");
  it("should throw when introducing a relation that's already there");
  it("should throw when severing a relation that's not there");
  it("should trigger update events on both sides when relations change");
  it("should send correct commands when relations are introduced and severed");
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
