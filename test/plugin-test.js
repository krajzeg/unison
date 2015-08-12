let assert = require('chai').assert;
let unison = require('../lib');

describe("Plugins", () => {
  it("should be able to add methods to the core Unison object", () => {
    let u = unison({});

    u.plugin(() => {
      return {
        methods: {
          greeting: () => "Hello!"
        }
      };
    });

    assert.equal(u.greeting(), "Hello!");
  });

  it("should be able to add methods to nodes", () => {
    let u = unison({'apple': {}});
    u.plugin(() => {
      return {
        nodeMethods: {
          uppercasePath() { return this.path().toUpperCase(); }
        }
      }
    });

    assert.equal(u('apple').uppercasePath(), 'APPLE');
  });

  it("should be able to affect the Unison object directly if really needed", () => {
    let u = unison({});

    u.plugin((unison) => {
      unison.iWasThere = true;
    });

    assert.equal(u.iWasThere, true);
  });

  it("should be able to wrap selected unison methods", () => {
    let u = unison({'things': {}});
    u.plugin(() => {
      return {
        methodWrappers: {
          nextId(oNextId) {
            let standardId = oNextId.apply(this);
            return '#' + standardId;
          }
        }
      }
    });

    u('things').add({name: 'screwdriver'});
    assert.ok(u('things.#1').get)
  });

  it("should be able to wrap selected node methods", () => {
    let u = unison({'apple': {}});
    u.plugin(() => {
      return {
        nodeMethodWrappers: {
          add(oAdd, id, obj) {
            oAdd.apply(this, [id.toLowerCase(), obj]);
          }
        }
      }
    });

    u('apple').add('SEED', {});
    assert.ok(u('apple.seed').get)
  });
});