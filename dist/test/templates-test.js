'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var templates = require('../lib').templates;

describe("Templates plugin", function () {
  it("should automatically apply templates specified in add()-ed objects", function () {
    var u = unison({}).plugin(templates({ 
      goblin: { name: "Goblin" } }));


    u().add('goblin', { template: 'goblin' });

    assert.equal(u('goblin').get.name, 'Goblin');});


  it("should result in object with both their own and template properties", function () {});



  it("should expose a spawn() method to easily create templated objects");
  it("should give access to the templates via u.template()");});
//# sourceMappingURL=templates-test.js.map