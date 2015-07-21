'use strict';var assert = require('chai').assert;
var unison = require('../lib');
var sinon = require('sinon');
var client = require('../lib/plugins/client');
var CommunicationMock = require('./mocks/client-comm');

describe('Unison network client', function () {
  it('should translate intent methods into network messages properly', function () {
    var comm = new CommunicationMock();

    var $$ = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: {}, 
      intents: { 
        frob: function frob(howHard) {}, 


        ageBy: function ageBy(howMany, units) {} } }));





    $$('bird').frob('very hard');
    $$('bird').ageBy(5, 'years');

    assert.deepEqual(comm.sentMessages, [
    ['i', 'frob', 'bird', ['very hard']], 
    ['i', 'ageBy', 'bird', [5, 'years']]]);});



  it('should apply commands sent by the server', function () {
    var comm = new CommunicationMock();
    var $$ = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: { 
        frob: function frob(howHard) {
          this.update({ frobbed: howHard });} }, 


      intents: {} }));


    comm.pushServerCommand('frob', 'bird', 'very hard');

    assert.equal($$('bird').state().frobbed, 'very hard');});


  it('should not break on receiving various broken messages', function () {
    var comm = new CommunicationMock();
    var $$ = unison({ bird: {} }).
    plugin(client({ 
      communication: comm, 
      commands: {}, intents: {} }));


    comm.pushServerString('['); // broken JSON
    comm.pushServerString('fw0ur0q923'); // not JSON
    comm.pushServerString('123'); // not a command or intent
    comm.pushServerString('[1,2,3,4]'); // bad format
    comm.pushServerCommand('bogusCommand', 'bogusObject', 'bogus'); // non-existent command

    // if we reach the end of the test, we should be OK
  });

  it('should handle _seed commands out of the box', function () {
    var comm = new CommunicationMock();
    var $$ = unison({}).
    plugin(client({ 
      communication: comm, 
      commands: {}, 
      intents: {} }));


    var listener = sinon.spy();
    $$('').on('childAdded', listener);

    comm.pushServerCommand('_seed', '', { bird: { wingspan: 6 }, seeded: true });

    assert.equal($$('seeded').state(), true);
    assert.equal($$('bird').state().wingspan, 6);
    assert.ok(listener.calledOnce);});}); // body irrelevant on the client
// body irrelevant on the client
//# sourceMappingURL=client-test.js.map