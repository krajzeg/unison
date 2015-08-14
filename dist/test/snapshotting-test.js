'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');

describe('Snapshot nodes', function () {
  it('should access state corresponding to their timestamp', function () {
    var u = unison({ paladin: { life: 5 } });

    var paladin = u('paladin');
    _.range(0, 5).forEach(function () {
      paladin.update({ life: paladin.get.life - 1 });});


    assert.equal(u('paladin').get.life, 0);
    _.range(0, 5).forEach(function (time) {
      assert.equal(u('paladin').at(time).get.life, 5 - time);});});



  it('should return similarly snapshotted nodes when navigating using parent(), child(), find() etc.', function () {
    var u = unison({ paladin: { life: 5 }, goblin: { life: 12 }, battle: 'raging' });

    u('paladin').update({ life: 666 });
    u('goblin').update({ life: 0 });
    u('').update({ battle: 'won' });

    var paladinSnapshot = u('paladin').at(0);
    assert.equal(paladinSnapshot.parent().get.battle, 'raging');
    assert.equal(paladinSnapshot.parent().child('goblin').get.life, 12);

    assert.equal(paladinSnapshot.root().find('goblin').parent().child('paladin').get.life, 5);});


  it('should throw if an invalid timestamp is requested', function () {
    var u = unison({ paladin: { life: 5 } });
    assert.throws(function () {return u('paladin').at(1);});});


  it('should throw when used to perform updates', function () {
    var u = unison({ paladin: { life: 4, shield: {} } });

    assert.throws(function () {
      u('paladin').at(0).update({ life: 7 });});

    assert.throws(function () {
      u('paladin').at(0).add('sword', {});});

    assert.throws(function () {
      u('paladin').at(0).remove('shield');});});



  it('should support only a limited number of steps in the past to keep memory usage down', function () {
    var u = unison({ paladin: { life: 15, shield: {} } }, { backlogSize: 10 });

    var paladin = u('paladin');
    _.range(0, 15).forEach(function () {
      paladin.update({ life: paladin.get.life - 1 });});


    assert.equal(u('paladin').at(6).get.life, 9);
    assert.throws(function () {return u('paladin').at(5);});});});
//# sourceMappingURL=snapshotting-test.js.map