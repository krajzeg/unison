let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');

describe("Snapshot nodes", () => {
  it("should access state corresponding to their timestamp", () => {
    let u = unison({ paladin: {life: 5} });

    let paladin = u('paladin');
    _.range(0,5).forEach(() => {
      paladin.update({life: paladin.get.life - 1});
    });

    assert.equal(u('paladin').get.life, 0);
    _.range(0,5).forEach((time) => {
      assert.equal(u('paladin').at(time).get.life, 5 - time);
    });
  });

  it("should return similarly snapshotted nodes when navigating using parent(), child(), find() etc.", () => {
    let u = unison({ paladin: {life: 5}, goblin: {life: 12}, battle: 'raging' });

    u('paladin').update({life: 666});
    u('goblin').update({life: 0});
    u('').update({battle: 'won'});

    let paladinSnapshot = u('paladin').at(0);
    assert.equal(paladinSnapshot.parent().get.battle, 'raging');
    assert.equal(paladinSnapshot.parent().child('goblin').get.life, 12);

    assert.equal(paladinSnapshot.root().find('goblin').parent().child('paladin').get.life, 5);
  });

  it("should throw if an invalid timestamp is requested", () => {
    let u = unison({ paladin: {life: 5} });
    assert.throws(() => u('paladin').at(1));
  });

  it("should throw when used to perform updates", () => {
    let u = unison({ paladin: {life: 4, shield: {}} });

    assert.throws(() => {
      u('paladin').at(0).update({life: 7});
    });
    assert.throws(() => {
      u('paladin').at(0).add('sword', {});
    });
    assert.throws(() => {
      u('paladin').at(0).remove('shield');
    });
  });

  it("should support only a limited number of steps in the past to keep memory usage down", () => {
    let u = unison({ paladin: {life: 15, shield: {}} }, {backlogSize: 10});

    let paladin = u('paladin');
    _.range(0,15).forEach(() => {
      paladin.update({life: paladin.get.life - 1});
    });

    assert.equal(u('paladin').at(6).get.life, 9);
    assert.throws(() => u('paladin').at(5));
  });
});