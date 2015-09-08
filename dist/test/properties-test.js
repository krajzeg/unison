'use strict';var assert = require('chai').assert;
var sinon = require('sinon');
var unison = require('../lib');
var properties = unison.properties;

describe("Properties plugin", function () {
  it("should allow defining property methods", function () {
    var u = unison({ 
      goblin: { health: 6, damage: 4 } });

    u.plugin(properties());

    u.define({ 
      properties: { 
        lifeLeft: function lifeLeft() {return this.get.health - this.get.damage;} } });



    assert.equal(u('goblin').lifeLeft(), 2);});});
//# sourceMappingURL=properties-test.js.map