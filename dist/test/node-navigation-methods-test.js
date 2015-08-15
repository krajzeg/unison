'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe("Node operations", function () {
  var u = unison({ 
    creatures: { 
      goblin: { 
        life: 7 }, 

      knight: { 
        shield: { armor: 3 }, 
        life: 8 }, 

      orc: { 
        life: 9 } }, 


    turn: 3 });


  describe("parent()", function () {
    it("should return the correct parent node", function () {
      assert.ok(u('creatures.knight.shield').parent().is(u('creatures.knight')));
      assert.ok(u('creatures.knight').parent().is(u('creatures')));
      assert.ok(u('creatures').parent().is(u()));});

    it("should throw when used on the root node", function () {
      assert.throws(function () {return u().parent();});});});



  describe("child()", function () {
    it("should find children correctly", function () {
      assert.ok(u().child('creatures').is(u('creatures')));
      assert.ok(u('creatures').child('knight').is(u('creatures.knight')));
      assert.ok(u('creatures').child('knight').child('shield').is(u('creatures.knight.shield')));});

    it("should work for non-existent nodes", function () {
      assert.ok(u().child('bogus').is(u('bogus')));});});



  describe("find()", function () {
    it("should find descendants correctly", function () {
      assert.ok(u().find("creatures.knight").is(u('creatures.knight')));
      assert.ok(u("creatures").find("knight").is(u('creatures.knight')));
      assert.ok(u("creatures").find("knight.shield").is(u('creatures.knight.shield')));});

    it("should work for non-existent nodes", function () {
      assert.ok(u().find("bogus.node").is(u("bogus.node")));});});



  describe("is()", function () {
    it("should return true for different objects pointing to the same node", function () {
      assert.ok(u('creatures.goblin').is(u('creatures.goblin')));
      assert.ok(u().is(u()));
      assert.ok(u('creatures.knight.shield').is(u('creatures.knight.shield')));});

    it("should return false for objects pointing to different nodes", function () {
      assert.ok(!u('creatures.goblin').is(u('creatures.orc')));});

    it("should return true for objects pointing to the same node at different timestamps", function () {
      assert.ok(u('creatures.goblin').at(0).is(u('creatures.goblin')));});});



  describe("children()", function () {
    it("should return all child objects and no properties", function () {
      var rootChildren = u().children().map(function (n) {return n.path();});
      var creatures = u('creatures').children().map(function (n) {return n.path();});
      var knightsPossessions = u('creatures.knight').children().map(function (n) {return n.path();});

      assert.sameMembers(rootChildren, ['creatures']);
      assert.sameMembers(creatures, ['creatures.goblin', 'creatures.knight', 'creatures.orc']);
      assert.sameMembers(knightsPossessions, ['creatures.knight.shield']);});});



  describe("root()", function () {
    it("should find the root node correctly", function () {
      var root = u();
      assert.ok(u('creatures.goblin').root().is(root));
      assert.ok(u('creatures.knight.shield').root().is(root));
      assert.ok(u('creatures').root().is(root));
      assert.ok(u().root().is(root));});});});
//# sourceMappingURL=node-navigation-methods-test.js.map