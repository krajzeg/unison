var assert = require('chai').assert;
var unison = require('../lib');

describe("update()", () => {
  var u;
  beforeEach(() => {
    u = unison({
      bird: {
        name: 'eagle'
      }
    });
  });

  it("should allow adding new properties", () => {
    u('bird').update({wingspan: 150});
    assert.deepEqual(u('bird').state(), {
      name: 'eagle', wingspan: 150
    });
  });

  it("should allow changing existing properties", () => {
    u('bird').update({name: 'sparrow'});
    assert.deepEqual(u('bird').state(), {
      name: 'sparrow'
    });
  });

  it("should allow changing multiple properties at a time", () => {
    u('bird').update({name: 'swallow', wingspan: 42});
    assert.deepEqual(u('bird').state(), {
      name: 'swallow', wingspan: 42
    });
  });

  it("should do nothing for non-existent nodes", () => {
    u('bogus').update({some: 'properties'});
    assert.strictEqual(u('bogus').state(), undefined);
  });
});

describe("add()", () => {
  var u;
  beforeEach(() => {
    u = unison({
      things: {
        screwdriver: {name: "screwdriver"}
      }
    });
  });

  it("should automatically assign IDs to children and return their path", () => {
    var hairdryerPath = u('things').add({name: 'hairdryer'});
    var lemonPath = u('things').add({name: 'lemon'});

    assert.ok(hairdryerPath && lemonPath);

    assert.ok(/^things\./.test(hairdryerPath));
    assert.ok(/^things\./.test(lemonPath));

    assert.equal(u(hairdryerPath).state().name, 'hairdryer');
    assert.equal(u(lemonPath).state().name, 'lemon');
  });

  it("should respect manually chosen IDs if provided", () => {
    var hairdryerPath = u('things').add('hairdryer', {name: 'hairdryer'});

    assert.equal(hairdryerPath, 'things.hairdryer');
    assert.equal(u(hairdryerPath).state().name, 'hairdryer');
  });

  it("should throw and leave things unchanged if you add a child that exists already", () => {
    assert.throws(() => {
      u('things').add('screwdriver', {name: 'duplicate'});
    });
    assert.deepEqual(u('things.screwdriver').state(), {name: 'screwdriver'});
  });

  it("should throw on non-existent nodes", () => {
    assert.throws(() => {
      u('bogus').add({something: 'here'});
    });
  });

  it("should throw when adding to a non-object", () => {
    assert.throws(() => {
      u('things.screwdriver.name').add({something: 'here'});
    });
  });
});

describe("remove()", () => {
  var u;
  beforeEach(() => {
    u = unison({
      things: {
        screwdriver: {name: "screwdriver"},
        lemon: {name: 'lemon'}
      }
    });
  });

  it("should remove existing children and return true", () => {
    let removed = u('things').remove('screwdriver');
    assert.strictEqual(removed, true);
    assert.strictEqual(u('things.screwdriver').state(), undefined);
    assert.deepEqual(u('things').state(), {
      lemon: {name: 'lemon'}
    });
  });

  it("should return false if we attempt to remove a non-existent child", () => {
    let removed = u('things').remove('leafblower');
    assert.strictEqual(removed, false);
  });

  it("should throw on non-existent nodes", () => {
    assert.throws(() => {
      u('bogus').remove('makes-no-sense');
    });
  });

  it("should throw when removing from non-objects", () => {
    assert.throws(() => {
      u('things.screwdriver.name').remove('makes-no-sense');
    });
  });
});

describe("destroy()", () => {
  var u;
  beforeEach(() => {
    u = unison({
      things: {
        screwdriver: {name: "screwdriver"},
        lemon: {name: 'lemon'}
      }
    });
  });

  it("should remove the object from its parent and return true", () => {
    u('things.screwdriver').destroy();

    assert.strictEqual(u('things.screwdriver').state(), undefined);
    assert.deepEqual(u('things').state(), {
      lemon: {name: 'lemon'}
    });
  });

  it("should throw for non-existent nodes", () => {
    assert.throws(() => {
      u('things.bogus').destroy();
    });
  });
});
