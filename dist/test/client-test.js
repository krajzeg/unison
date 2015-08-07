'use strict';var assert = require('chai').assert;
var unison = require('../lib');
var client = require('../lib').client;
var sinon = require('sinon');
var CommunicationMock = require('./mocks/client-comm');

describe("Client plugin", function () {
  it("should translate intent methods into network messages properly", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: {}, 
      intents: { 
        frob: function frob(howHard) {
          // body irrelevant on the client
        }, 
        ageBy: function ageBy(howMany, units) {
          // body irrelevant on the client
        } } }));



    u('bird').frob('very hard');
    u('bird').ageBy(5, 'years');

    assert.deepEqual(comm.sentMessages, [
    ['i', 'frob', 'bird', ['very hard'], 1], 
    ['i', 'ageBy', 'bird', [5, 'years'], 2]]);});



  it("should translate command methods into simple executions", function () {
    var comm = new CommunicationMock();
    var u = unison({}).
    plugin(client({ 
      communication: comm, 
      commands: { 
        frob: function frob() {
          this.update({ frobbed: true });} }, 


      intents: {} }));


    u('').frob();
    assert.ok(u('').get.frobbed);
    assert.deepEqual(comm.sentMessages, []);});


  it("should apply commands sent by the server", function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} }, 


      intents: {} }));


    comm.pushServerCommand('frob', 'bird', 'very hard');

    assert.equal(u('bird').get.frobbed, 'very hard');});


  it("should not break on receiving various broken messages", function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: {}, intents: {} }));


    comm.pushServerString("["); // broken JSON
    comm.pushServerString("fw0ur0q923"); // not JSON
    comm.pushServerString("123"); // not a command or intent
    comm.pushServerString("[1,2,3,4]"); // bad format
    comm.pushServerCommand('bogusCommand', 'bogusObject', 'bogus'); // non-existent command

    // if we reach the end of the test, we should be OK
  });

  it("should handle '_seed' commands out of the box", function () {
    var comm = new CommunicationMock();
    var u = unison({}).
    plugin(client({ 
      communication: comm, 
      commands: {}, 
      intents: {} }));


    var listener = sinon.spy();
    u('').on('childAdded', listener);

    comm.pushServerCommand('_seed', '', { bird: { wingspan: 6 }, seeded: true });

    assert.equal(u('seeded').get, true);
    assert.equal(u('bird').get.wingspan, 6);
    assert.ok(listener.calledOnce);});


  it("should allow adding commands and intents after the fact", function () {
    var comm = new CommunicationMock();
    var u = unison({}).
    plugin(client({ 
      communication: comm, 
      commands: {}, 
      intents: {} }));


    u.addCommand('frob', function () {
      this.update({ frobbed: true });});

    u.addIntent('pleaseFrob', function () {});

    u('').frob();
    u('').pleaseFrob();

    assert.ok(u('').get.frobbed);
    assert.deepEqual(comm.sentMessages, [
    ['i', 'pleaseFrob', '', [], 1]]);});



  it("should serialize objects in intent arguments correctly", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {}, human: {} }).
    plugin(client({ 
      communication: comm, 
      commands: {}, 
      intents: { 
        frob: function frob(somebodyElse) {} } }));



    u('bird').frob(u('human'));

    assert.deepEqual(comm.sentMessages, [
    ['i', 'frob', 'bird', [{ _u: 'human' }], 1]]);});



  it("should deserialize objects in received command arguments", function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: { 
        frob: function frob(who) {
          who.update({ frobbed: true });} }, 


      intents: {} }));


    comm.pushServerCommand('frob', '', { _u: 'bird' });

    assert.equal(u('bird').get.frobbed, true);});});
//# sourceMappingURL=client-test.js.map