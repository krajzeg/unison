let _ = require('lodash');
let assert = require('chai').assert;
let unison = require('../lib');
let templates = require('../lib').templates;

let client = require('../lib').client;
var CommunicationMock = require('./mocks/client-comm');



describe("Templates plugin", () => {
  let u;

  beforeEach(() => {
    u = unison({}).plugin(templates({
      creatures: {
        goblin: {name: "Goblin"}
      }
    }))
  });

  it("should automatically apply templates to add()-ed objects", () => {
    u().add('goblin', {template: 'creatures.goblin', life: 12});
    assert.equal(u('goblin').get.name, 'Goblin');
    assert.equal(u('goblin').get.life, 12);
    assert.equal(u('goblin').get.template, 'creatures.goblin');
  });

  it("should do nothing to objects that don't want templates", () => {
    u().add('banana', {juiciness: 7});
    assert.ok(u('banana').get);
    assert.equal(u('banana').get.juiciness, 7);
  });

  it("should keep the template after updates", () => {
    let goblin = u().add('goblin', {template: 'creatures.goblin', life: 12});
    goblin.update({life: 6});
    assert.equal(goblin.get.life, 6);
    assert.equal(goblin.get.name, 'Goblin');
  });

  it("should apply templates for objects seeded from server", () => {
    let comm = new CommunicationMock();
    u.plugin(client({communication: comm}));

    comm.pushServerCommand('_seed', '', {
      creatures: {
        creature1: {template: 'creatures.goblin', life: 10}
      }
    });

    assert.equal(u('creatures.creature1').get.name, 'Goblin');
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