let assert = require('chai').assert;

import { stateWithUpdate, stateWithDelete } from '../lib/immutable-states';

describe("stateWithUpdate()", () => {
  it("should return an updated state and keep the original intact", () => {
    let original = {
      paladin: {life: 15},
      goblin: {life: 12, shield: {broken: false}}
    };

    let carbonCopy = JSON.parse(JSON.stringify(original));

    let updated1 = stateWithUpdate(original, 'goblin', {life: 0});
    let updated2 = stateWithUpdate(updated1, '', {orc: {life: 13}});
    let updated3 = stateWithUpdate(updated2, 'goblin.shield', {broken: true});

    assert.equal(updated3.goblin.life, 0);
    assert.equal(updated2.goblin.life, 0);
    assert.equal(updated1.goblin.life, 0);

    assert.equal(updated3.orc.life, 13);
    assert.equal(updated2.orc.life, 13);
    assert.equal(updated1.orc, undefined);

    assert.equal(updated3.goblin.shield.broken, true);
    assert.equal(updated2.goblin.shield.broken, false);
    assert.equal(updated1.goblin.shield.broken, false);

    assert.deepEqual(original, carbonCopy);
  });
});

describe("stateWithDelete()", () => {
  it("should return a state with properties removed and keep the original intact", () => {
    let original = {
      paladin: {life: 15},
      goblin: {life: 12, shield: {heavy: true}}
    };

    let carbonCopy = JSON.parse(JSON.stringify(original));

    let deleted1 = stateWithDelete(original, 'goblin.shield');
    let deleted2 = stateWithDelete(deleted1, 'paladin');

    assert.deepEqual(original, carbonCopy);
    assert.deepEqual(deleted1, {
      goblin: {life: 12},
      paladin: {life: 15}
    });
    assert.deepEqual(deleted2, {
      goblin: {life: 12}
    });
  });
});
