'use strict';var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib').server;
var CommunicationMock = require('./mocks/server-comm');

describe('Server plugin', function () {
  it('should translate command methods into local changes and network messages to all clients', function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} }).
    plugin(server({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} }, 


      intents: {} }));


    comm.attach('client1');
    comm.attach('client2');

    u('bird').frob('very hard');

    assert.deepEqual(u('bird').get, { frobbed: 'very hard' });
    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', ['very hard']]));

    assert.ok(comm.containsMessageFor('client2', 
    ['c', 'frob', 'bird', ['very hard']]));});



  it('should translate intents from clients into command executions via the intent methods', function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} }).
    plugin(server({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard, by) {
          this.update({ frobbed: howHard, by: by });} }, 


      intents: { 
        pleaseFrob: function pleaseFrob(howHard, client) {
          this.frob(howHard, client);} } }));




    comm.attach('client1');
    comm.pushClientMessage('client1', ['i', 'pleaseFrob', 'bird', ['lightly']]);

    var bird = u('bird').get;
    assert.equal(bird.frobbed, 'lightly');
    assert.equal(bird.by, 'client1');

    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', ['lightly', 'client1']]));});



  it('should not send commands to clients that have already detached', function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: {} }).
    plugin(server({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} } }));




    comm.attach('client1');
    u('bird').frob('lightly');
    comm.detach('client1');
    u('bird').frob('gently');

    var frobMessages = _.where(comm.messagesSentTo('client1'), { 1: 'frob' });
    assert.equal(frobMessages.length, 1);
    assert.deepEqual(frobMessages[0], ['c', 'frob', 'bird', ['lightly']]);});


  it('should send a \'_seed\' command with the current state to newly attached clients', function () {
    var comm = new CommunicationMock();

    var u = unison({ bird: { wingspan: 6 } }).
    plugin(server({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} } }));




    comm.attach('client1');

    var messages = comm.messagesSentTo('client1');
    assert.deepEqual(messages, [
    ['c', '_seed', '', [{ bird: { wingspan: 6 } }]]]);});



  it('should allow adding commands and intents after the fact', function () {
    var comm = new CommunicationMock();
    var u = unison({ bird: {} }).
    plugin(server({ communication: comm }));

    u.addIntent('pleaseFrob', function () {this.frob();});
    u.addCommand('frob', function () {this.update({ frobbed: true });});

    u('bird').pleaseFrob();

    assert.ok(u('bird').get.frobbed);});});
//# sourceMappingURL=server-test.js.map