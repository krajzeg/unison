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

});