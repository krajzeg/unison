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



describe('add()', function () {
  var $$;
  beforeEach(function () {
    $$ = unison.local({ 
      things: { 
        screwdriver: { name: 'screwdriver' } } });});




  it('should automatically assign IDs to children and return their path', function () {
    var hairdryerPath = $$('things').add({ name: 'hairdryer' });
    var lemonPath = $$('things').add({ name: 'lemon' });

    assert.ok(hairdryerPath && lemonPath);

    assert.ok(/^things\./.test(hairdryerPath));
    assert.ok(/^things\./.test(lemonPath));

    assert.equal($$(hairdryerPath).state().name, 'hairdryer');
    assert.equal($$(lemonPath).state().name, 'lemon');});


  it('should respect manually chosen IDs if provided', function () {
    var hairdryerPath = $$('things').add('hairdryer', { name: 'hairdryer' });

    assert.equal(hairdryerPath, 'things.hairdryer');
    assert.equal($$(hairdryerPath).state().name, 'hairdryer');});


  it('should throw and leave things unchanged if you add a child that exists already', function () {
    assert.throws(function () {
      $$('things').add('screwdriver', { name: 'duplicate' });});

    assert.deepEqual($$('things.screwdriver').state(), { name: 'screwdriver' });});


  it('should throw on non-existent nodes', function () {
    assert.throws(function () {
      $$('bogus').add({ something: 'here' });});});});




describe('remove()', function () {
  it('should remove existing children and return true');
  it('should return false if we attempt to remove a non-existent child');
  it('should break on non-existent nodes');});


describe('destroy()', function () {
  it('should remove the object from its parent and return true');
  it('should break for non-existent nodes');});
//# sourceMappingURL=basic-updates-test.js.map