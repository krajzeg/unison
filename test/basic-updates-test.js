var assert = require('chai').assert;
var unison = require('../lib');

describe("update()", () => {
  var $$;
  beforeEach(() => {
    $$ = unison({
      bird: {
        name: 'eagle'
      }
    });
  });

  it("should allow adding new properties", () => {
    $$('bird').update({wingspan: 150});
    assert.deepEqual($$('bird').state(), {
      name: 'eagle', wingspan: 150
    });
  });

  it("should allow changing existing properties", () => {
    $$('bird').update({name: 'sparrow'});
    assert.deepEqual($$('bird').state(), {
      name: 'sparrow'
    });
  });

  it("should allow changing multiple properties at a time", () => {
    $$('bird').update({name: 'swallow', wingspan: 42});
    assert.deepEqual($$('bird').state(), {
      name: 'swallow', wingspan: 42
    });
  });

  it("should do nothing for non-existent nodes", () => {
    $$('bogus').update({some: 'properties'});
    assert.strictEqual($$('bogus').state(), undefined);
  });
});

describe("add()", () => {
  var $$;
  beforeEach(() => {
    $$ = unison({
      things: {
        screwdriver: {name: "screwdriver"}
      }
    });
  });

  it("should automatically assign IDs to children and return their path", () => {
    var hairdryerPath = $$('things').add({name: 'hairdryer'});
    var lemonPath = $$('things').add({name: 'lemon'});

    assert.ok(hairdryerPath && lemonPath);

    assert.ok(/^things\./.test(hairdryerPath));
    assert.ok(/^things\./.test(lemonPath));

    assert.equal($$(hairdryerPath).state().name, 'hairdryer');
    assert.equal($$(lemonPath).state().name, 'lemon');
  });

  it("should respect manually chosen IDs if provided", () => {
    var hairdryerPath = $$('things').add('hairdryer', {name: 'hairdryer'});

    assert.equal(hairdryerPath, 'things.hairdryer');
    assert.equal($$(hairdryerPath).state().name, 'hairdryer');
  });

  it("should throw and leave things unchanged if you add a child that exists already", () => {
    assert.throws(() => {
      $$('things').add('screwdriver', {name: 'duplicate'});
    });
    assert.deepEqual($$('things.screwdriver').state(), {name: 'screwdriver'});
  });

  it("should throw on non-existent nodes", () => {
    assert.throws(() => {
      $$('bogus').add({something: 'here'});
    });
  });

  it("should throw when adding to a non-object", () => {
    assert.throws(() => {
      $$('things.screwdriver.name').add({something: 'here'});
    });
  });
});

describe("remove()", () => {
  var $$;
  beforeEach(() => {
    $$ = unison({
      things: {
        screwdriver: {name: "screwdriver"},
        lemon: {name: 'lemon'}
      }
    });
  });

  it("should remove existing children and return true", () => {
    let removed = $$('things').remove('screwdriver');
    assert.strictEqual(removed, true);
    assert.strictEqual($$('things.screwdriver').state(), undefined);
    assert.deepEqual($$('things').state(), {
      lemon: {name: 'lemon'}
    });
  });

  it("should return false if we attempt to remove a non-existent child", () => {
    let removed = $$('things').remove('leafblower');
    assert.strictEqual(removed, false);
  });

  it("should throw on non-existent nodes", () => {
    assert.throws(() => {
      $$('bogus').remove('makes-no-sense');
    });
  });

  it("should throw when removing from non-objects", () => {
    assert.throws(() => {
      $$('things.screwdriver.name').remove('makes-no-sense');
    });
  });
});

describe("destroy()", () => {
  var $$;
  beforeEach(() => {
    $$ = unison({
      things: {
        screwdriver: {name: "screwdriver"},
        lemon: {name: 'lemon'}
      }
    });
  });

  it("should remove the object from its parent and return true", () => {
    $$('things.screwdriver').destroy();

    assert.strictEqual($$('things.screwdriver').state(), undefined);
    assert.deepEqual($$('things').state(), {
      lemon: {name: 'lemon'}
    });
  });

  it("should throw for non-existent nodes", () => {
    assert.throws(() => {
      $$('things.bogus').destroy();
    });
  });
});
