let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let templates = require('../lib').templates;

describe("Templates plugin", () => {
  it("should automatically apply templates specified in add()-ed objects", () => {
    let u = unison({}).plugin(templates({
      goblin: {name: "Goblin"}
    }));

    u().add('goblin', {template: 'goblin'});

    assert.equal(u('goblin').get.name, 'Goblin');
  });

  it("should result in object with both their own and template properties", () => {

  });

  it("should expose a spawn() method to easily create templated objects");
  it("should give access to the templates via u.template()");
});