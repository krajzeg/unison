'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib').server;
var sinon = require('sinon');
var Promise = require('bluebird');
var CommunicationMock = require('./mocks/server-comm');

describe("Server plugin", function () {
  it("should translate command methods into local changes and network messages to all clients", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} });
    u.define({ 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} } });



    u.plugin(server({ communication: comm }));

    comm.attach('client1');
    comm.attach('client2');

    u('bird').frob('very hard');

    assert.deepEqual(u('bird').get, { frobbed: 'very hard' });
    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', ['very hard']]));

    assert.ok(comm.containsMessageFor('client2', 
    ['c', 'frob', 'bird', ['very hard']]));});



  it("should translate intents from clients into command executions via the intent methods", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} });
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob(howHard, by) {
          this.update({ frobbed: howHard, by: by });} }, 


      intents: { 
        pleaseFrob: function pleaseFrob(howHard, client) {
          this.frob(howHard, client.id);} } });




    comm.attach('client1');
    comm.pushClientMessage('client1', ['i', 'pleaseFrob', 'bird', ['lightly'], 1]);

    var bird = u('bird').get;
    assert.equal(bird.frobbed, 'lightly');
    assert.equal(bird.by, 'client1');

    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', ['lightly', 'client1']]));});



  it("should let intents store data on the client objects", function () {
    var comm = new CommunicationMock();

    var counterValues = {};

    var u = unison({});
    u.plugin(server({ communication: comm }));
    u.define({ 
      intents: { 
        pleaseBumpCounter: function pleaseBumpCounter(client) {
          client.counter = client.counter ? client.counter + 1 : 1;
          counterValues[client.id] = client.counter;} } });




    comm.attach('client1');comm.attach('client2');
    comm.pushClientMessage('client1', ['i', 'pleaseBumpCounter', '', [], 1]);
    comm.pushClientMessage('client2', ['i', 'pleaseBumpCounter', '', [], 2]);
    comm.pushClientMessage('client1', ['i', 'pleaseBumpCounter', '', [], 3]);

    assert.equal(counterValues['client1'], 2);
    assert.equal(counterValues['client2'], 1);});


  it("should trigger before:X/after:X events on all command executions", function () {
    var comm = new CommunicationMock();
    var u = unison({});
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob() {
          this.update({ frobbed: true });
          this.futz();}, 

        futz: function futz() {
          this.update({ futzed: true });} } });




    var calls = [], events = ['before:frob', 'after:frob', 'before:futz', 'after:futz'];
    _.map(events, function (event) {
      u().on(event, function (evt) {
        calls.push(evt.name);});});



    u().frob();

    assert.deepEqual(calls, ['before:frob', 'before:futz', 'after:futz', 'after:frob']);});


  it("should not send commands nested in other command executions", function () {
    var comm = new CommunicationMock();
    var u = unison({});
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob() {
          this.update({ frobbed: true });
          this.futz();}, 

        futz: function futz() {
          this.update({ futzed: true });} } });




    comm.attach('client1');
    u().frob();

    var messages = comm.messagesSentTo('client1').slice(1); // remove the _seed command
    assert.equal(messages.length, 1);
    assert.deepEqual(messages[0], ['c', 'frob', '', []]);
    assert.deepEqual(u().state(), { frobbed: true, futzed: true });});


  it("should not send commands to clients that have already detached", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} });
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} } });




    comm.attach('client1');
    u('bird').frob('lightly');
    comm.detach('client1');
    u('bird').frob('gently');

    var frobMessages = _.where(comm.messagesSentTo('client1'), { 1: 'frob' });
    assert.equal(frobMessages.length, 1);
    assert.deepEqual(frobMessages[0], ['c', 'frob', 'bird', ['lightly']]);});


  it("should send a '_seed' command with the current state to newly attached clients", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: { wingspan: 6 } });
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} } });




    comm.attach('client1');

    var messages = comm.messagesSentTo('client1');
    assert.deepEqual(messages, [
    ['c', '_seed', '', [{ bird: { wingspan: 6 } }]]]);});



  it("should not propagate state under 'local' through the '_seed' command", function () {
    var comm = new CommunicationMock();

    var u = unison({ 
      answer: 42, 
      local: { should: ['not', 'be', 'propagated'] } });

    u.plugin(server({ communication: comm }));

    comm.attach('client1');

    var messages = comm.messagesSentTo('client1');
    assert.deepEqual(messages, [
    ['c', '_seed', '', [{ answer: 42 }]]]);});



  it("should serialize and deserialize objects over the network correctly", function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {}, human: {} });
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        frob: function frob(who) {who.update({ frobbedBy: this.path() });} }, 

      intents: { 
        pleaseFrob: function pleaseFrob(who) {
          this.frob(who);} } });




    comm.attach('client1');
    comm.pushClientMessage('client1', ['i', 'pleaseFrob', 'bird', [{ _u: 'human' }], 1]);

    assert.equal(u('human').get.frobbedBy, 'bird');
    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', [{ _u: 'human' }]]));});



  it("should send correct responses when an intent function returns a value", function (done) {
    var comm = new CommunicationMock();

    var u = unison({});
    u.plugin(server({ communication: comm }));
    u.define({ 
      intents: { 
        pleaseFrob: function pleaseFrob() {
          return "Frobbed!";} } });




    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(function () {
      assert.ok(comm.containsMessageFor('client1', 
      ['r', 'ok', 1, "Frobbed!"]));}).

    then(done)['catch'](done);});


  it("should act correctly when an intent function returns a promise", function (done) {
    var comm = new CommunicationMock();

    var u = unison({});
    u.plugin(server({ communication: comm }));
    u.define({ 
      intents: { 
        pleaseFrob: function pleaseFrob() {
          return wait(10).then(function () {return "Frobbed!";});} } });




    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(function () {
      assert.ok(comm.containsMessageFor('client1', 
      ['r', 'ok', 1, "Frobbed!"]));}).

    then(done)['catch'](done);});


  it("should send correct responses when an intent function unexpectedly fails", function (done) {
    var comm = new CommunicationMock(), errorSpy = sinon.spy();

    var srv = server({ 
      communication: comm, 
      unexpectedErrorMessage: 'Argh!', 
      errorHandler: errorSpy });

    var u = unison({}).plugin(srv);
    u.define({ 
      intents: { 
        pleaseFrob: function pleaseFrob() {
          throw new Error("It hurts a lot.");} } });




    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(function () {
      assert.ok(comm.containsMessageFor('client1', 
      ['r', 'err', 1, "Argh!"]));

      assert.ok(errorSpy.calledOnce);}).
    then(done)['catch'](done);});



  it("should send correct responses when an intent function throws a UserError", function (done) {
    var comm = new CommunicationMock(), errorSpy = sinon.spy();
    var srv = server({ 
      communication: comm, 
      errorHandler: errorSpy });

    var u = unison({}).plugin(srv);
    u.define({ 
      intents: { 
        pleaseFrob: function pleaseFrob() {
          throw new unison.UserError("Not frobbable.");} } });




    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(function () {
      assert.ok(comm.containsMessageFor('client1', 
      ['r', 'err', 1, "Not frobbable."]));

      assert.ok(!errorSpy.called);}).
    then(done)['catch'](done);});


  it("should serialize objects returned from intents", function (done) {
    var comm = new CommunicationMock();

    var u = unison({ cockatoo: {} });
    u.plugin(server({ communication: comm }));
    u.define({ 
      intents: { 
        pleaseFrob: function pleaseFrob() {
          return this;} } });




    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', 'cockatoo', [], 1]).then(function () {
      assert.ok(comm.containsMessageFor('client1', 
      ['r', 'ok', 1, { _u: 'cockatoo' }]));}).

    then(done)['catch'](done);});


  it("should let us recognize that we're on the serverside", function () {
    var comm = new CommunicationMock();
    var u = unison({}).plugin(server({ communication: comm }));

    assert.ok(u.serverSide);});


  it("should allow extra information to be sent along with commands by other plugins", function () {
    var comm = new CommunicationMock();

    var u = unison({});
    u.plugin(server({ communication: comm }));
    u.define({ 
      commands: { 
        applySpecialSauce: function applySpecialSauce() {
          var u = this.u;
          u.plugins.server.getCommandExtras().specialSauce = 'applied';} } });




    comm.attach('client1');
    u().applySpecialSauce();

    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'applySpecialSauce', '', [], { specialSauce: 'applied' }]));});});





function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);});}
//# sourceMappingURL=server-test.js.map