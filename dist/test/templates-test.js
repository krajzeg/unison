'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var templates = require('../lib').templates;

describe("Templates plugin", function () {
  var u = undefined;

  beforeEach(function () {
    u = unison({}).plugin(templates({ 
      creatures: { 
        goblin: { name: "Goblin" } } }));});




  it("should automatically apply templates specified in add()-ed objects", function () {
    u().add('goblin', { template: 'creatures.goblin', life: 12 });
    assert.equal(u('goblin').get.name, 'Goblin');
    assert.equal(u('goblin').get.life, 12);
    assert.equal(u('goblin').get.template, 'creatures.goblin');});


  it("should do nothing to objects that don't want templates", function () {
    u().add('banana', { juiciness: 7 });
    assert.ok(u('banana').get);
    assert.equal(u('banana').get.juiciness, 7);});


  it("should expose a spawn() method to easily create templated objects", function () {
    u().spawn('creatures.goblin', { life: 12 });
    assert.equal(u('goblin#1').get.name, 'Goblin');
    assert.equal(u('goblin#1').get.life, 12);});


  it("should give access to the templates via u.template()", function () {
    assert.equal(u.template('creatures.goblin').name, 'Goblin');});});
//# sourceMappingURL=templates-test.js.map