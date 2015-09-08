let assert = require('chai').assert;
let sinon = require('sinon');
let unison = require('../lib');
let properties = unison.properties;

describe("Properties plugin", () => {
  it("should allow defining property methods", () => {
    let u = unison({
      goblin: {health: 6, damage: 4}
    });
    u.plugin(properties());

    u.define({
      properties: {
        lifeLeft() { return this.get.health - this.get.damage; }
      }
    });

    assert.equal(u('goblin').lifeLeft(), 2);
  });
});