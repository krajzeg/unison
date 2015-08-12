let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let templates = require('../lib').templates;

describe("Templates plugin", () => {
  let u;

  beforeEach(() => {
    u = unison({}).plugin(templates({
      creatures: {
        goblin: {name: "Goblin"}
      }
    }))
  });

  it("should automatically apply templates specified in add()-ed objects", () => {
    u().add('goblin', {template: 'creatures.goblin', life: 12});
    assert.equal(u('goblin').get.name, 'Goblin');
    assert.equal(u('goblin').get.life, 12);
    assert.equal(u('goblin').get.template, 'creatures.goblin');
  });

  it("should expose a spawn() method to easily create templated objects", () => {
    u().spawn('creatures.goblin', {life: 12});
    assert.equal(u('goblin#1').get.name, 'Goblin');
    assert.equal(u('goblin#1').get.life, 12);
  });

  it("should give access to the templates via u.template()", () => {
    assert.equal(u.template('creatures.goblin').name, 'Goblin');
  });
});