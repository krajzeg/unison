'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe("Type system", function () {
  it("should let us get the type of each node via a type() method", function () {
    var u = unison({});
    u.define('Fruit');

    u().add('orange', { _t: 'Fruit', name: 'orange' });

    assert.equal(u('orange').type().name, 'Fruit');});


  it("should use Node as the type of nodes that don't choose otherwise", function () {
    var u = unison({});
    var node = u().add({});
    assert.equal(node.type().name, 'Node');});


  it("should use Root as the default type of the root node", function () {
    var u = unison({});
    assert.equal(u().type().name, 'Root');});


  it("should let objects of the type to be added easily via a constructor-like function", function () {
    var u = unison({});
    u.define('Vegetable');

    u().add('cucumber', u.Vegetable({ name: 'cucumber' }));
    assert.equal(u('cucumber').type(), u.types.Vegetable);
    assert.equal(u('cucumber').get.name, 'cucumber');});


  it("should expose the properties from the Node type on nodes of all types", function () {
    var u = unison({});
    u.define('Fruit');
    var orange = u().add(u.Fruit({ name: 'orange' }));

    u.types.Node.proto.name = function () {return this.get.name;};

    assert.equal(orange.name(), 'orange');});


  it("should expose the properties of leaf types only on nodes of that type", function () {
    var u = unison({});
    u.define('Monster');
    var goblin = u().add(u.Monster({ strength: 12 }));
    var acid = u().add({ strength: 15 });

    u.types.Monster.proto.strength = function () {return this.get.strength;};

    assert.equal(goblin.strength(), 12);
    assert.throws(function () {return acid.strength();});});});
//# sourceMappingURL=typing-tests.js.map