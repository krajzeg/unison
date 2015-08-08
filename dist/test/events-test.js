'use strict';var assert = require('chai').assert;
var sinon = require('sinon');
var unison = require('../lib');

describe("When objects are updated", function () {
  var u = undefined;
  beforeEach(function () {
    u = unison({ 
      bird: { name: 'eagle' } });});



  it("events should be triggered once for each update", function () {
    var callback = sinon.spy();

    u('bird').on('updated', callback);
    u('bird').update({ wingspan: 12 });
    u('bird').update({ soaring: 'high' });

    assert.ok(callback.calledTwice);});});



describe("Multiple listeners per event", function () {
  it("should be supported", function () {
    var u = unison({}), spy1 = sinon.spy(), spy2 = sinon.spy();
    u('').on('updated', spy1);
    u('').on('updated', spy2);

    u('').update({ hi: 'There' });
    u('').update({ another: 'update' });

    assert.ok(spy1.calledTwice);
    assert.ok(spy2.calledTwice);});});



describe("When children are added", function () {
  var u = undefined;
  beforeEach(function () {
    u = unison({ 
      food: {} });});



  it("a correct 'created' event should trigger on the child", function () {
    var spy = sinon.spy();

    u('food.cucumber').on('created', spy);
    u('food').add('cucumber', { name: 'cucumber' });

    assert.ok(spy.calledOnce);});


  it("'created' events should trigger for nested objects", function () {
    var created = sinon.spy(), deepCreated = sinon.spy();

    u('food.apple.seed.inside').on('created', deepCreated);
    u('food.apple.seed.outside').on('created', deepCreated);
    u('food.apple.seed').on('created', created);

    u('food').add('apple', { seed: { inside: {}, outside: {} } });

    assert.ok(created.calledOnce);
    assert.ok(deepCreated.calledTwice);});});



describe("When children are removed", function () {
  var u = undefined;
  beforeEach(function () {
    u = unison({ 
      food: { 
        apple: { seed: { inside: {}, outside: {} } } } });});




  it("a correct 'destroyed' event should trigger on the child", function () {
    var spy = sinon.spy();

    u('food.apple.seed.inside').on('destroyed', spy);
    u('food.apple.seed.inside').destroy();

    assert.ok(spy.calledOnce);});


  it("'destroyed' events should trigger for nested objects", function () {
    var destroyed = sinon.spy(), deepDestroyed = sinon.spy(), wildcardDestroyed = sinon.spy();

    u('food.apple.seed.inside').on('destroyed', deepDestroyed);
    u('food.apple.seed.outside').on('destroyed', deepDestroyed);
    u('food.apple.seed').on('destroyed', destroyed);
    u.listen('food.apple.seed.*', 'destroyed', wildcardDestroyed);

    u('food.apple').destroy();

    assert.ok(destroyed.calledOnce);
    assert.ok(deepDestroyed.calledTwice);
    assert.ok(wildcardDestroyed.calledTwice);});});
//# sourceMappingURL=events-test.js.map