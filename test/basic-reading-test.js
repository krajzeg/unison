var assert = require('chai').assert;
var unison = require('../lib');

describe("Grabbing nodes and their state", () => {
  // given this state
  var state = {
    name: "John",
    relations: {
      wife: "Jill",
      brother: "Jeff"
    }
  };
  var $$ = unison(state);

  // this all should work
	it("should work for one-element paths", () => {
    assert.equal($$.grab('name').state(), "John");
	});

  it("should treat '' as a path to the root state", () => {
    assert.deepEqual($$.grab('').state(), state);
  });

  it("should return nodes that don't exist yet, with null state", () => {
    assert.ok($$.grab('bogus'));
    assert.strictEqual($$.grab('bogus').state(), undefined);
  });

  it("should work for deep paths", () => {
    assert.equal($$.grab('relations.wife').state(), "Jill");
    assert.equal($$.grab('relations.brother').state(), "Jeff");
  });
});
