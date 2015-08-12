'use strict';var _libImmutableStates = require(

'../lib/immutable-states');var assert = require('chai').assert;

describe('stateWithUpdate()', function () {
  it('should return an updated state and keep the original intact', function () {
    var original = { 
      paladin: { life: 15 }, 
      goblin: { life: 12, shield: { broken: false } } };


    var carbonCopy = JSON.parse(JSON.stringify(original));

    var updated1 = (0, _libImmutableStates.stateWithUpdate)(original, 'goblin', { life: 0 });
    var updated2 = (0, _libImmutableStates.stateWithUpdate)(updated1, '', { orc: { life: 13 } });
    var updated3 = (0, _libImmutableStates.stateWithUpdate)(updated2, 'goblin.shield', { broken: true });

    assert.equal(updated3.goblin.life, 0);
    assert.equal(updated2.goblin.life, 0);
    assert.equal(updated1.goblin.life, 0);

    assert.equal(updated3.orc.life, 13);
    assert.equal(updated2.orc.life, 13);
    assert.equal(updated1.orc, undefined);

    assert.equal(updated3.goblin.shield.broken, true);
    assert.equal(updated2.goblin.shield.broken, false);
    assert.equal(updated1.goblin.shield.broken, false);

    assert.deepEqual(original, carbonCopy);});});



describe('stateWithDelete()', function () {
  it('should return a state with properties removed and keep the original intact', function () {
    var original = { 
      paladin: { life: 15 }, 
      goblin: { life: 12, shield: { heavy: true } } };


    var carbonCopy = JSON.parse(JSON.stringify(original));

    var deleted1 = (0, _libImmutableStates.stateWithDelete)(original, 'goblin.shield');
    var deleted2 = (0, _libImmutableStates.stateWithDelete)(deleted1, 'paladin');

    assert.deepEqual(original, carbonCopy);
    assert.deepEqual(deleted1, { 
      goblin: { life: 12 }, 
      paladin: { life: 15 } });

    assert.deepEqual(deleted2, { 
      goblin: { life: 12 } });});});
//# sourceMappingURL=immutable-states-test.js.map