'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe('update()', function () {
  var $$;
  beforeEach(function () {
    $$ = unison.local({ 
      bird: { 
        name: 'eagle' } });});




  it('should allow adding new properties', function () {
    $$('bird').update({ wingspan: 150 });
    assert.deepEqual($$('bird').state(), { 
      name: 'eagle', wingspan: 150 });});



  it('should allow changing existing properties', function () {
    $$('bird').update({ name: 'sparrow' });
    assert.deepEqual($$('bird').state(), { 
      name: 'sparrow' });});



  it('should allow changing multiple properties at a time', function () {
    $$('bird').update({ name: 'swallow', wingspan: 42 });
    assert.deepEqual($$('bird').state(), { 
      name: 'swallow', wingspan: 42 });});



  it('should do nothing for non-existent nodes', function () {
    $$('bogus').update({ some: 'properties' });
    assert.strictEqual($$('bogus').state(), undefined);});});
//# sourceMappingURL=basic-updates-test.js.map