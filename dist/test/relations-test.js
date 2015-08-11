'use strict';var _slicedToArray = (function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i['return']) _i['return']();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError('Invalid attempt to destructure non-iterable instance');}};})();var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var client = require('../lib').client;
var relations = require('../lib').relatives;
var sinon = require('sinon');

describe("Relations plugin", function () {

  it("should allow introducing and checking relations between objects from both sides", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    alice.now('childOf', bob);

    assert.ok(tom.fatherOf(jerry));
    assert.ok(jerry.childOf(tom));
    assert.ok(bob.fatherOf(alice));
    assert.ok(alice.childOf(bob));});


  it("should allow severing relations between objects", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    tom.noLonger('fatherOf', jerry);

    assert.ok(!tom.fatherOf(jerry));
    assert.ok(!jerry.childOf(tom));});


  it("should support getting related objects through properly named methods", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    tom.now('fatherOf', jerry);
    tom.now('fatherOf', alice);

    assert.equal(jerry.father().path(), 'tom');
    assert.equal(alice.father().path(), 'tom');
    assert.deepEqual(_.invoke(tom.children(), 'path'), ['jerry', 'alice']);

    assert.equal(bob.father(), undefined);
    assert.deepEqual(bob.children(), []);});


  it("should throw when introducing a relation that's already there", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry');

    tom.now('fatherOf', jerry);
    assert.throws(function () {
      tom.now('fatherOf', jerry);});});



  it("should throw when severing a relation that's not there", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), bob = u('bob');

    assert.throws(function () {return tom.noLonger('fatherOf', bob);});});


  it("should trigger 'updated' events on both sides when relations change", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry');
    var tomSpy = sinon.spy(), jerrySpy = sinon.spy();

    tom.on('updated', tomSpy);jerry.on('updated', jerrySpy);

    tom.now('fatherOf', jerry);
    jerry.noLonger('childOf', tom);

    assert.ok(tomSpy.calledTwice);
    assert.ok(jerrySpy.calledTwice);});


  it("should trigger 'now:X' and 'noLonger:x' events when relations change", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry');
    var nowSpy = sinon.spy(), noLongerSpy = sinon.spy();

    tom.on('now:fatherOf', nowSpy);
    jerry.on('noLonger:childOf', noLongerSpy);

    tom.now('fatherOf', jerry);
    tom.noLonger('fatherOf', jerry);

    assert.ok(nowSpy.calledOnce);
    assert.ok(noLongerSpy.calledOnce);
    assert.equal(nowSpy.firstCall.args[0].target.path(), 'jerry');
    assert.equal(noLongerSpy.firstCall.args[0].target.path(), 'tom');});


  it("should send correct commands when relations are introduced and severed", function () {
    var server = require('../lib').server;
    var comm = new (require('./mocks/server-comm'))();
    var u = unison({ 
      tom: {}, jerry: {} });

    u.plugin(server({ communication: comm }));
    u.plugin(relations([{ AtoB: 'likes', BtoA: 'likedBy', Bs: 'liked', As: 'likers' }]));

    comm.attach('test');

    u('tom').now('likes', u('jerry'));
    u('jerry').noLonger('likedBy', u('tom'));

    assert.deepEqual(comm.messagesSentTo('test')[1], 
    ['c', 'now', 'tom', ['likes', { _u: 'jerry' }]]);

    assert.deepEqual(comm.messagesSentTo('test')[2], 
    ['c', 'noLonger', 'jerry', ['likedBy', { _u: 'tom' }]]);});



  it("should automatically sever an old n:1 relation when the 1-side changes", function () {
    var u = unison({ 
      doctor: {}, london: {}, tardis: {}, bobby: {} });

    u.plugin(relations([
    { AtoB: 'contains', BtoA: 'isIn', A: 'location', Bs: 'contents' }]));var _$map = 


    _.map(['doctor', 'london', 'tardis', 'bobby'], function (path) {return u(path);});var _$map2 = _slicedToArray(_$map, 4);var doctor = _$map2[0];var london = _$map2[1];var tardis = _$map2[2];var bobby = _$map2[3];
    london.now('contains', bobby);
    london.now('contains', doctor);
    doctor.now('isIn', tardis); // this should move him away from London too

    assert.ok(doctor.isIn(tardis));
    assert.ok(!doctor.isIn(london));
    assert.deepEqual(_.invoke(london.contents(), 'path'), ['bobby']);
    assert.equal(doctor.location().path(), 'tardis');});


  it("should automatically sever an old 1:1 relation when a new one is added", function () {
    var u = unison({ 
      door: {}, redKnob: {}, blueKnob: {} });

    u.plugin(relations([
    { AtoB: 'opens', BtoA: 'openedBy', A: 'door', B: 'knob' }]));var _$map3 = 


    _.map(['door', 'redKnob', 'blueKnob'], function (path) {return u(path);});var _$map32 = _slicedToArray(_$map3, 3);var door = _$map32[0];var redKnob = _$map32[1];var blueKnob = _$map32[2];
    door.now('openedBy', redKnob);
    door.now('openedBy', blueKnob);

    assert.ok(door.openedBy(blueKnob));
    assert.ok(!door.openedBy(redKnob));
    assert.ok(blueKnob.opens(door));
    assert.ok(!redKnob.opens(door));
    assert.equal(redKnob.door(), undefined);});


  it("should reflect the state at snapshot time when used with a snapshot node", function () {
    var u = prepareUnisonInstance([
    { AtoB: 'fatherOf', BtoA: 'childOf', A: 'father', Bs: 'children' }]);

    var tom = u('tom'), jerry = u('jerry'), alice = u('alice'), bob = u('bob');

    // each "now" and "noLonger" operation costs two updates (to both objects), so timestamps increment by 2
    tom.now('fatherOf', jerry); // timestamp 2: tom.children = [jerry]
    tom.now('fatherOf', alice); // timestamp 4: tom.children = [jerry, alice]

    var oldTom = u('tom').at(2), oldJerry = u('jerry').at(2), oldAlice = u('alice').at(2);

    // check state at timestamp 1
    assert.deepEqual(_.invoke(oldTom.children(), 'path'), ['jerry']);
    assert.equal(oldJerry.father().path(), 'tom');
    assert.equal(oldAlice.father(), undefined);

    assert.ok(oldTom.fatherOf(oldJerry));
    assert.ok(!oldTom.fatherOf(oldAlice));
    assert.ok(oldJerry.childOf(oldTom));
    assert.ok(!oldAlice.childOf(oldTom));});});



function prepareUnisonInstance(rels) {
  var u = unison({ 
    tom: {}, jerry: {}, bob: {}, alice: {} });

  u.plugin(relations(rels));
  return u;}
//# sourceMappingURL=relations-test.js.map