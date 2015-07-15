'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe('Grabbing nodes and their state', function () {
  // given this state
  var state = { 
    name: 'John', 
    relations: { 
      wife: 'Jill', 
      brother: 'Jeff' } };


  var $$ = unison.local(state);

  // this all should work
  it('should work for one-element paths', function () {
    assert.equal($$.grab('name').state(), 'John');});


  it('should treat \'\' as a path to the root state', function () {
    assert.deepEqual($$.grab('').state(), state);});


  it('should return nodes that don\'t exist yet, with null state', function () {
    assert.ok($$.grab('bogus'));
    assert.strictEqual($$.grab('bogus').state(), undefined);});


  it('should work for deep paths', function () {
    assert.equal($$.grab('relations.wife').state(), 'Jill');
    assert.equal($$.grab('relations.brother').state(), 'Jeff');});});
//# sourceMappingURL=basic-reading-test.js.map