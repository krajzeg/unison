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
});