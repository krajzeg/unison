'use strict';var assert = require('chai').assert;
var unison = require('../lib');
var client = require('../lib').client;
var sinon = require('sinon');
var Promise = require('bluebird');
var CommunicationMock = require('./mocks/client-comm');

describe("Client plugin", function () {
  it("should translate intent methods into network messages properly", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      commands: {}, 
      intents: { 
        frob: function frob(howHard) {
          // body irrelevant on the client
        }, 
        ageBy: function ageBy(howMany, units) {
          // body irrelevant on the client
        } } });



    u('bird').frob('very hard');
    u('bird').ageBy(5, 'years');

    assert.deepEqual(comm.sentMessages, [
    ['i', 'frob', 'bird', ['very hard'], 1], 
    ['i', 'ageBy', 'bird', [5, 'years'], 2]]);});



  it("should translate command methods into simple executions", function () {
    var comm = new CommunicationMock();
    var u = unison({});
    u.plugin(client({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob() {
          this.update({ frobbed: true });} }, 


      intents: {} });


    u('').frob();
    assert.ok(u('').get.frobbed);
    assert.deepEqual(comm.sentMessages, []);});


  it("should trigger 'before:X' and 'after:X' events for command executions", function () {
    var comm = new CommunicationMock();
    var u = unison({ frobbed: false });
    u.plugin(client({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob() {
          this.update({ frobbed: true });} } });




    var beforeFrobState = undefined, afterFrobState = undefined;
    u().on('before:frob', function (evt) {beforeFrobState = evt.snapshot.get.frobbed;});
    u().on('after:frob', function (evt) {afterFrobState = evt.snapshot.get.frobbed;});

    comm.pushServerCommand('frob', '');

    assert.strictEqual(beforeFrobState, false);
    assert.strictEqual(afterFrobState, true);});


  it("should apply commands sent by the server", function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} }, 


      intents: {} });


    comm.pushServerCommand('frob', 'bird', 'very hard');

    assert.equal(u('bird').get.frobbed, 'very hard');});


  it("should not break on receiving various broken messages", function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));

    comm.pushServerString("["); // broken JSON
    comm.pushServerString("fw0ur0q923"); // not JSON
    comm.pushServerString("123"); // not a command or intent
    comm.pushServerString("[1,2,3,4]"); // bad format
    comm.pushServerCommand('bogusCommand', 'bogusObject', 'bogus'); // non-existent command

    // if we reach the end of the test, we should be OK
  });

  it("should handle '_seed' commands out of the box", function () {
    var comm = new CommunicationMock();
    var u = unison({});
    u.plugin(client({ communication: comm }));

    var listener = sinon.spy();
    u.listen('*', 'created', listener);

    comm.pushServerCommand('_seed', '', { bird: { wingspan: 6 }, seeded: true });

    assert.equal(u('seeded').get, true);
    assert.equal(u('bird').get.wingspan, 6);
    assert.ok(listener.calledOnce);});


  it("should produce the same IDs as the server after being seeded", function () {
    var comm = new CommunicationMock();
    var u = unison({});
    u.plugin(client({ communication: comm }));

    comm.pushServerCommand('_seed', '', { _nextId: 6, bird: { wingspan: 6 }, seeded: true });

    assert.equal(u().add({}).id(), '6');});


  it("should serialize objects in intent arguments correctly", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {}, human: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      intents: { 
        frob: function frob(somebodyElse) {} } });



    u('bird').frob(u('human'));

    assert.deepEqual(comm.sentMessages, [
    ['i', 'frob', 'bird', [{ _u: 'human' }], 1]]);});



  it("should deserialize objects in received command arguments", function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob(who) {
          who.update({ frobbed: true });} }, 


      intents: {} });


    comm.pushServerCommand('frob', '', { _u: 'bird' });

    assert.equal(u('bird').get.frobbed, true);});


  it("should resolve intent promises with return values from the server", function (done) {
    var comm = new CommunicationMock(), resolvedSpy = sinon.spy();
    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      intents: { frob: function frob() {} } });


    u('bird').frob().
    then(function (result) {
      assert.equal(result.path(), 'bird');}).

    then(resolvedSpy).
    then(done)['catch'](done);

    assert.ok(!resolvedSpy.called);
    comm.pushServerResponse('ok', 1, { _u: 'bird' });});


  it("should reject intent promises with errors from the server", function (done) {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      intents: { frob: function frob() {} } });


    expectRejection(u('bird').frob()).
    then(function (err) {
      assert.equal(err.intent, 'frob');
      assert.equal(err.target.path(), 'bird');
      assert.equal(err.message, "Oops.");}).
    then(done)['catch'](done);

    comm.pushServerResponse('err', 1, "Oops.");});


  it("should trigger 'error' events when an intent fails", function () {
    var comm = new CommunicationMock(), errorSpy = sinon.spy();
    var u = unison({ bird: {} });
    u.plugin(client({ communication: comm }));
    u.define({ 
      intents: { frob: function frob() {} } });


    u('bird').on('error', errorSpy);
    u('bird').frob()['catch'](function () {});
    comm.pushServerResponse('err', 1, "Oops.");

    assert.ok(errorSpy.calledOnce);});


  it("should let us recognize that we're on the clientside", function () {
    var comm = new CommunicationMock();
    var u = unison({}).plugin(client({ communication: comm }));

    assert.ok(u.clientSide);});


  it("should make command extras sent by the server available during command execution", function () {
    var comm = new CommunicationMock();
    var u = unison({});
    u.plugin(client({ communication: comm }));
    u.define({ 
      commands: { 
        applySpecialSauce: function applySpecialSauce() {
          var u = this.u, sauce = u.plugins.client.getCommandExtras().sauce;
          u().update({ sauce: sauce });} } });




    comm.pushServerString('["c","applySpecialSauce","",[],{"sauce":"worcestershire"}]');

    assert.equal(u().get.sauce, "worcestershire");});


  it("should distinguish types correctly when applying commands", function () {
    var comm = new CommunicationMock();
    var u = unison({ 
      bird: { _t: 'Bird' }, 
      dog: { _t: 'Dog' } });

    u.plugin(client({ communication: comm }));

    u.define('Bird', { 
      commands: { 
        makeNoise: function makeNoise() {this.update({ chirped: true });} } });


    u.define('Dog', { 
      commands: { 
        makeNoise: function makeNoise() {this.update({ bark: 'loud' });} } });



    comm.pushServerCommand('makeNoise', 'bird', []);
    comm.pushServerCommand('makeNoise', 'dog', []);

    assert.equal(u('bird').get.chirped, true);
    assert.equal(u('dog').get.bark, 'loud');});});



function expectRejection(promise) {
  return new Promise(function (resolve, reject) {
    promise.then(function (result) {
      reject('The promise wasn\'t rejected, but resolved with value ' + result + '.');})['catch'](
    resolve);});}
//# sourceMappingURL=client-test.js.map