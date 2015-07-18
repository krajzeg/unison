let assert = require('chai').assert;
let unison = require('../lib');

describe("Plugins", () => {
  it("should be able to add methods to the core Unison object", () => {
    let $$ = unison.local({});

    $$.plugin(() => {
      return {
        methods: {
          greeting: () => "Hello!"
        }
      };
    });

    assert.equal($$.greeting(), "Hello!");
  });

  it("should be able to add methods to nodes", () => {
    let $$ = unison.local({'apple': {}});
    $$.plugin(() => {
      return {
        nodeMethods: {
          uppercasePath() { return this.path().toUpperCase(); }
        }
      }
    });

    assert.equal($$('apple').uppercasePath(), 'APPLE');
  });

  it("should be able to affect the Unison object directly if really needed", () => {
    let $$ = unison.local({});

    $$.plugin((unison) => {
      unison.iWasThere = true;
    });

    assert.equal($$.iWasThere, true);
  });
});