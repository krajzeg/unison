'use strict';var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib/plugins/server');
var CommunicationMock = require('./mocks/server-comm');

describe('Unison network server', function () {
  it('should translate command methods into local changes and network messages to all clients', function () {
    var comm = new CommunicationMock();

    var $$ = unison.
    local({ bird: {} }).
    plugin(server({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} }, 


      intents: {} }));


    comm.attach('client1');
    comm.attach('client2');

    $$('bird').frob('very hard');

    assert.deepEqual($$('bird').state(), { frobbed: 'very hard' });
    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', ['very hard']]));

    assert.ok(comm.containsMessageFor('client2', 
    ['c', 'frob', 'bird', ['very hard']]));});



  it('should translate intents from clients into command executions via the intent methods', function () {
    var comm = new CommunicationMock();

    var $$ = unison.
    local({ bird: {} }).
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

    var bird = $$('bird').state();
    assert.equal(bird.frobbed, 'lightly');
    assert.equal(bird.by, 'client1');

    assert.ok(comm.containsMessageFor('client1', 
    ['c', 'frob', 'bird', ['lightly', 'client1']]), 
    'client should receive a command back');});


  it('should not send commands to clients that have already detached');
  it('should send a \'seed\' command to newly attached clients');});
//# sourceMappingURL=server-test.js.map