'use strict';var assert = require('chai').assert;
var sinon = require('sinon');
var unison = require('../lib');

describe("When objects are updated", function () {
  var $$ = undefined;
  beforeEach(function () {
    $$ = unison({ 
      bird: { name: 'eagle' } });});



  it("events should be triggered once for each update", function () {
    var callback = sinon.spy();

    $$('bird').on('updated', callback);
    $$('bird').update({ wingspan: 12 });
    $$('bird').update({ soaring: 'high' });

    assert.ok(callback.calledTwice);});});



describe("When children are added", function () {
  var $$ = undefined;
  beforeEach(function () {
    $$ = unison({ 
      food: {} });});



  it("a correct 'childAdded' event should trigger on its parent", function () {
    var spy = sinon.spy();

    $$('food').on('childAdded', spy);
    $$('food').add('cucumber', { name: 'cucumber' });

    assert.ok(spy.calledOnce);
    assert.ok(spy.calledWith('cucumber'));});


  it("a correct 'created' event should trigger on the child", function () {
    var spy = sinon.spy();

    $$('food.cucumber').on('created', spy);
    $$('food').add('cucumber', { name: 'cucumber' });

    assert.ok(spy.calledOnce);});


  it("'childAdded' and 'created' events should trigger for nested objects", function () {
    var created = sinon.spy(), childAdded = sinon.spy(), 
    deepCreated = sinon.spy(), deepChildAdded = sinon.spy();

    $$('food.apple.seed.inside').on('created', deepCreated);
    $$('food.apple.seed.outside').on('created', deepCreated);
    $$('food.apple.seed').on('created', created);
    $$('food.apple').on('childAdded', childAdded);
    $$('food.apple.seed').on('childAdded', deepChildAdded);

    $$('food').add('apple', { seed: { inside: {}, outside: {} } });

    assert.ok(created.calledOnce);
    assert.ok(childAdded.calledOnce);
    assert.ok(deepCreated.calledTwice);
    assert.ok(deepChildAdded.calledTwice);});});



describe("When children are removed", function () {
  var $$ = undefined;
  beforeEach(function () {
    $$ = unison({ 
      food: { 
        apple: { seed: { inside: {}, outside: {} } } } });});




  it("a correct 'childRemoved' event should trigger on its parent", function () {
    var spy = sinon.spy();

    $$('food.apple.seed').on('childRemoved', spy);
    $$('food.apple.seed.inside').destroy();

    assert.ok(spy.calledOnce);
    assert.ok(spy.calledWith('inside'));});


  it("a correct 'destroyed' event should trigger on the child", function () {
    var spy = sinon.spy();

    $$('food.apple.seed.inside').on('destroyed', spy);
    $$('food.apple.seed.inside').destroy();

    assert.ok(spy.calledOnce);});


  it("'childRemoved' and 'destroyed' events should trigger for nested objects", function () {
    var destroyed = sinon.spy(), childRemoved = sinon.spy(), deepDestroyed = sinon.spy();

    $$('food.apple.seed.inside').on('destroyed', deepDestroyed);
    $$('food.apple.seed.outside').on('destroyed', deepDestroyed);
    $$('food.apple.seed').on('destroyed', destroyed);
    $$('food.apple').on('childRemoved', childRemoved);

    $$('food.apple').destroy();

    assert.ok(destroyed.calledOnce);
    assert.ok(childRemoved.calledOnce);
    assert.ok(deepDestroyed.calledTwice);});});
//# sourceMappingURL=events-test.js.map