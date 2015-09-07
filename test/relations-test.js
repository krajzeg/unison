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
    assert.equal(nowSpy.firstCall.args[0].target.path(), 'jerry');
    assert.equal(noLongerSpy.firstCall.args[0].target.path(), 'tom');
  });

  it("should send correct commands when relations are introduced and severed", () => {
    let server = require('../lib').server;
    let comm = new (require('./mocks/server-comm'))();
    let u = unison({
      tom: {}, jerry:{}
    });
    u.plugin(server({communication: comm}));
    u.plugin(relations());
    u.define({
      relations: [
        {AtoB: 'likes', BtoA: 'likedBy', Bs: 'liked', As: 'likers'}
      ]
    });

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

  it("should automatically sever an old n:1 relation when the 1-side changes", () => {
    let u = unison({
      doctor: {}, london: {}, tardis: {}, bobby: {}
    });
    u.plugin(relations());
    u.define({
      relations: [
        {AtoB: 'contains', BtoA: 'isIn', A: 'location', Bs: 'contents'}
      ]
    });

    let [doctor, london, tardis, bobby] = _.map(['doctor', 'london', 'tardis', 'bobby'], (path) => u(path));
    london.now('contains', bobby);
    london.now('contains', doctor);
    doctor.now('isIn', tardis); // this should move him away from London too

    assert.ok(doctor.isIn(tardis));
    assert.ok(!doctor.isIn(london));
    assert.deepEqual(_.invoke(london.contents(), 'path'), ['bobby']);
    assert.equal(doctor.location().path(), 'tardis');
  });

  it("should automatically sever an old 1:1 relation when a new one is added", () => {
    let u = unison({
      door: {}, redKnob: {}, blueKnob: {}
    });
    u.plugin(relations());
    u.define({
      relations: [
        {AtoB: 'opens', BtoA: 'openedBy', A: 'door', B: 'knob'}
      ]
    });

    let [door, redKnob, blueKnob] = _.map(['door', 'redKnob', 'blueKnob'], (path) => u(path));
    door.now('openedBy', redKnob);
    door.now('openedBy', blueKnob);

    assert.ok(door.openedBy(blueKnob));
    assert.ok(!door.openedBy(redKnob));
    assert.ok(blueKnob.opens(door));
    assert.ok(!redKnob.opens(door));
    assert.equal(redKnob.door(), undefined);
  });

  it("should reflect the state at snapshot time when used with a snapshot node", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    // each "now" and "noLonger" operation costs two updates (to both objects), so timestamps increment by 2
    tom.now('fatherOf', jerry); // timestamp 2: tom.children = [jerry]
    tom.now('fatherOf', alice); // timestamp 4: tom.children = [jerry, alice]

    let oldTom = u('tom').at(2), oldJerry = u('jerry').at(2), oldAlice = u('alice').at(2);

    // check state at timestamp 1
    assert.deepEqual(_.invoke(oldTom.children(), 'path'), ['jerry']);
    assert.equal(oldJerry.father().path(), 'tom');
    assert.equal(oldAlice.father(), undefined);

    assert.ok(oldTom.fatherOf(oldJerry));
    assert.ok(!oldTom.fatherOf(oldAlice));
    assert.ok(oldJerry.childOf(oldTom));
    assert.ok(!oldAlice.childOf(oldTom));
  });

  it("should allow different types to use the same relation differently", () => {
    let u = unison({
      london: {_t: 'City'}, manchester: {_t: 'City'}, england: {_t: 'Country'},
      bucket: {_t: 'Vessel'}, water: {_t: 'Liquid'}
    });
    u.plugin(relations());
    u.define('City');
    u.define('Country', {
      relations: [{withType: 'City', AtoB: 'contains', BtoA: 'isIn', A: 'country', Bs: 'cities'}]
    });
    u.define('Liquid');
    u.define('Vessel', {
      relations: [{withType: 'Liquid', AtoB: 'contains', BtoA: 'isIn', A: 'vessel', B: 'liquid'}]
    });

    let [london, manchester, england, bucket, water] = _.map(['london', 'manchester', 'england', 'bucket', 'water'], (n) => u(n));

    london.now('isIn', england);
    england.now('contains', manchester);
    bucket.now('contains', water);

    assert.ok(england.contains(london));
    assert.ok(england.contains(manchester));
    assert.ok(bucket.contains(water));
    assert.ok(london.isIn(england));
    assert.ok(manchester.isIn(england));
    assert.ok(water.isIn(bucket));

    assert.sameMembers(_.map(england.cities(), (c) => c.path()), ['london', 'manchester']);
    assert.ok(london.country().is(england));
    assert.ok(manchester.country().is(england));
    assert.ok(bucket.liquid().is(water));
    assert.ok(water.vessel().is(bucket));
  });

  it("should reject mis-typed relations", () => {
    let u = unison({
      london: {_t: 'City'}, manchester: {_t: 'City'}, england: {_t: 'Country'},
      bucket: {_t: 'Vessel'}, water: {_t: 'Liquid'}
    });
    u.plugin(relations());
    u.define('City');
    u.define('Country', {
      relations: [{withType: 'City', AtoB: 'contains', BtoA: 'isIn', A: 'country', Bs: 'cities'}]
    });
    u.define('Liquid');
    u.define('Vessel', {
      relations: [{withType: 'Liquid', AtoB: 'contains', BtoA: 'isIn', A: 'vessel', B: 'liquid'}]
    });

    let [london, manchester, england, bucket, water] = _.map(['london', 'manchester', 'england', 'bucket', 'water'], (n) => u(n));

    assert.throws(() => { bucket.now('contains', london); });
    assert.throws(() => { england.now('contains', water); });
    assert.throws(() => { bucket.now('isIn', manchester); });
  });

  it("should allow inheritance of relations from Node", () => {
    let u = unison({});
    u.plugin(relations());
    u.define('Vegetable');
    u.define('Node', {
      relations: [{AtoB: 'contains', BtoA: 'isIn', A: 'location', B: 'content'}]
    });

    let bag = u().add('bag', {}), box = u().add('box', {});
    let cucumber = u().add('cucumber', u.Vegetable({}));
    let tomato = u().add('tomato', u.Vegetable({}));
    let seed1 = u().add({}), seed2 = u().add({});

    bag.now('contains', cucumber);
    tomato.now('isIn', box);

    cucumber.now('contains', seed1);
    seed2.now('isIn', tomato);

    assert.ok(bag.content().is(cucumber));
    assert.ok(box.content().is(tomato));
    assert.ok(cucumber.content().is(seed1));
    assert.ok(tomato.content().is(seed2));
  });

  it("should automatically sever relations to destroyed objects", () => {
    let u = prepareUnisonInstance([
      {AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children'}
    ]);
    let tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    bob.now('fatherOf', alice);

    jerry.destroy();
    bob.destroy();

    assert.deepEqual(tom.children(), []);
    assert.equal(alice.father(), undefined);
  });
});

function prepareUnisonInstance(rels) {
  let u = unison({
    tom: {}, jerry: {}, bob: {}, alice: {}
  });
  u.plugin(relations());
  u.define({relations: rels});

  return u;
}
