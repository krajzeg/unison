var assert = require('chai').assert;
var unison = require('../lib');

describe("Node operations", () => {
  let u = unison({
    creatures: {
      goblin: {
        life: 7
      },
      knight: {
        shield: {armor: 3},
        life: 8
      },
      orc: {
        life: 9
      }
    },
    turn: 3
  });

  describe("parent()", () => {
    it("should return the correct parent node", () => {
      assert.ok(u('creatures.knight.shield').parent().is(u('creatures.knight')));
      assert.ok(u('creatures.knight').parent().is(u('creatures')));
      assert.ok(u('creatures').parent().is(u()));
    });
    it("should throw when used on the root node", () => {
      assert.throws(() => u().parent());
    });
  });

  describe("child()", () => {
    it("should find children correctly", () => {
      assert.ok(u().child('creatures').is(u('creatures')));
      assert.ok(u('creatures').child('knight').is(u('creatures.knight')));
      assert.ok(u('creatures').child('knight').child('shield').is(u('creatures.knight.shield')));
    });
    it("should work for non-existent nodes", () => {
      assert.ok(u().child('bogus').is(u('bogus')));
    });
  });

  describe("find()", () => {
    it("should find descendants correctly", () => {
      assert.ok(u().find("creatures.knight").is(u('creatures.knight')));
      assert.ok(u("creatures").find("knight").is(u('creatures.knight')));
      assert.ok(u("creatures").find("knight.shield").is(u('creatures.knight.shield')));
    });
    it("should work for non-existent nodes", () => {
      assert.ok(u().find("bogus.node").is(u("bogus.node")));
    });
  });

  describe("is()", () => {
    it("should return true for different objects pointing to the same node", () => {
      assert.ok(u('creatures.goblin').is(u('creatures.goblin')));
      assert.ok(u().is(u()));
      assert.ok(u('creatures.knight.shield').is(u('creatures.knight.shield')));
    });
    it("should return false for objects pointing to different nodes", () => {
      assert.ok(!u('creatures.goblin').is(u('creatures.orc')));
    });
    it("should return true for objects pointing to the same node at different timestamps", () => {
      assert.ok(u('creatures.goblin').at(0).is(u('creatures.goblin')));
    });
    /*it("should return false when asked if we are null or undefined", () => {
      assert.ok(!u('creatures.goblin').is(null));
      assert.ok(!u('creatures.goblin').is(undefined));
    });*/
  });

  describe("children()", () => {
    it("should return all child objects and no properties", () => {
      let rootChildren = u().children().map((n) => n.path());
      let creatures = u('creatures').children().map((n) => n.path());
      let knightsPossessions = u('creatures.knight').children().map((n) => n.path());

      assert.sameMembers(rootChildren, ['creatures']);
      assert.sameMembers(creatures, ['creatures.goblin', 'creatures.knight', 'creatures.orc']);
      assert.sameMembers(knightsPossessions, ['creatures.knight.shield']);
    });
  });

  describe("root()", () => {
    it("should find the root node correctly", () => {
      let root = u();
      assert.ok(u('creatures.goblin').root().is(root));
      assert.ok(u('creatures.knight.shield').root().is(root));
      assert.ok(u('creatures').root().is(root));
      assert.ok(u().root().is(root));
    });
  });

});
