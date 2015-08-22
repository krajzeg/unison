'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe("update()", function () {
  var u;
  beforeEach(function () {
    u = unison({ 
      bird: { 
        name: 'eagle' } });});




  it("should allow adding new properties", function () {
    u('bird').update({ wingspan: 150 });
    assert.deepEqual(u('bird').get, { 
      name: 'eagle', wingspan: 150 });});



  it("should allow changing existing properties", function () {
    u('bird').update({ name: 'sparrow' });
    assert.deepEqual(u('bird').get, { 
      name: 'sparrow' });});



  it("should allow changing multiple properties at a time", function () {
    u('bird').update({ name: 'swallow', wingspan: 42 });
    assert.deepEqual(u('bird').get, { 
      name: 'swallow', wingspan: 42 });});



  it("should throw for non-existent nodes", function () {
    assert.throws(function () {
      u('bogus').update({ some: 'properties' });});});});




describe("add()", function () {
  var u;
  beforeEach(function () {
    u = unison({ 
      things: { 
        screwdriver: { name: "screwdriver" } } });});




  it("should automatically assign IDs to children and return the added node", function () {
    var hairdryer = u('things').add({ name: 'hairdryer' });
    var lemon = u('things').add({ name: 'lemon' });

    assert.equal(hairdryer.path(), 'things.1');
    assert.equal(lemon.path(), 'things.2');

    assert.equal(hairdryer.get.name, 'hairdryer');
    assert.equal(lemon.get.name, 'lemon');});


  it("should respect manually chosen IDs if provided", function () {
    var hairdryer = u('things').add('hairdryer', { name: 'hairdryer' });

    assert.equal(hairdryer.path(), 'things.hairdryer');
    assert.equal(hairdryer.get.name, 'hairdryer');});


  it("should throw and leave things unchanged if you add a child that exists already", function () {
    assert.throws(function () {
      u('things').add('screwdriver', { name: 'duplicate' });});

    assert.deepEqual(u('things.screwdriver').get, { name: 'screwdriver' });});


  it("should throw on non-existent nodes", function () {
    assert.throws(function () {
      u('bogus').add({ something: 'here' });});});



  it("should throw when adding to a non-object", function () {
    assert.throws(function () {
      u('things.screwdriver.name').add({ something: 'here' });});});



  it("should throw on adding things under an empty ID", function () {
    assert.throws(function () {u('').add('', {});});});


  it("should throw on adding things under an ID with a dot", function () {
    assert.throws(function () {u('').add('dotted.id', {});});});});




describe("remove()", function () {
  var u;
  beforeEach(function () {
    u = unison({ 
      things: { 
        screwdriver: { name: "screwdriver" }, 
        lemon: { name: 'lemon' } } });});




  it("should remove existing children and return true", function () {
    var removed = u('things').remove('screwdriver');
    assert.strictEqual(removed, true);
    assert.strictEqual(u('things.screwdriver').get, undefined);
    assert.deepEqual(u('things').get, { 
      lemon: { name: 'lemon' } });});



  it("should throw if we attempt to remove a non-existent child", function () {
    assert.throws(function () {
      u('things').remove('leafblower');});});



  it("should throw on non-existent nodes", function () {
    assert.throws(function () {
      u('bogus').remove('makes-no-sense');});});



  it("should throw when removing from non-objects", function () {
    assert.throws(function () {
      u('things.screwdriver.name').remove('makes-no-sense');});});});




describe("destroy()", function () {
  var u;
  beforeEach(function () {
    u = unison({ 
      things: { 
        screwdriver: { name: "screwdriver" }, 
        lemon: { name: 'lemon' } } });});




  it("should remove the object from its parent and return true", function () {
    u('things.screwdriver').destroy();

    assert.strictEqual(u('things.screwdriver').get, undefined);
    assert.deepEqual(u('things').get, { 
      lemon: { name: 'lemon' } });});



  it("should throw for non-existent nodes", function () {
    assert.throws(function () {
      u('things.bogus').destroy();});});});
//# sourceMappingURL=basic-updates-test.js.map