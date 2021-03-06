'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe("Grabbing nodes and their state", function () {
  // given this state
  var state = { 
    name: "John", 
    relatives: { 
      wife: "Jill", 
      brother: "Jeff" } };


  var u = unison(state);

  // this all should work
  it("should work for one-element paths", function () {
    assert.equal(u('name').get, "John");});


  it("should treat '' as a path to the root state", function () {
    assert.deepEqual(u('').get, state);});


  it("should treat no path whatsoever as requesting the root state", function () {
    assert.deepEqual(u().get, state);});


  it("should return nodes that don't exist yet, with null state", function () {
    assert.ok(u('bogus'));
    assert.strictEqual(u('bogus').get, undefined);});


  it("should work for deep paths", function () {
    assert.equal(u('relatives.wife').get, "Jill");
    assert.equal(u('relatives.brother').get, "Jeff");});});
//# sourceMappingURL=basic-reading-test.js.map