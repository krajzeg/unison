var assert = require('chai').assert;
var unison = require('../lib');
var client = require('../lib').client;
var sinon = require('sinon');
var CommunicationMock = require('./mocks/client-comm');

describe("Client plugin", () => {
  it("should translate intent methods into network messages properly", () => {
    let comm = new CommunicationMock();

    let $$ = unison({bird: {}})
      .plugin(client({
        communication: comm,
        commands: {},
        intents: {
          frob(howHard) {
            // body irrelevant on the client
          },
          ageBy(howMany, units) {
            // body irrelevant on the client
          }
        }
      }));

    $$('bird').frob('very hard');
    $$('bird').ageBy(5, 'years');

    assert.deepEqual(comm.sentMessages, [
     ['i', 'frob', 'bird', ['very hard']],
     ['i', 'ageBy', 'bird', [5, 'years']]
    ]);
  });

  it("should translate command methods into simple executions", () => {
    let comm = new CommunicationMock();
    let $$ = unison({})
      .plugin(client({
        communication: comm,
        commands: {
          frob() {
            this.update({frobbed: true});
          }
        },
        intents: {}
      }));

    $$('').frob();
    assert.ok($$('').state().frobbed);
    assert.deepEqual(comm.sentMessages, []);
  });

  it("should apply commands sent by the server", () => {
    let comm = new CommunicationMock();
    let $$ = unison({bird: {}})
      .plugin(client({
        communication: comm,
        commands: {
          frob(howHard) {
            this.update({frobbed: howHard});
          }
        },
        intents: {}
      }));

    comm.pushServerCommand('frob', 'bird', 'very hard');

    assert.equal($$('bird').state().frobbed, 'very hard');
  });

  it("should not break on receiving various broken messages", () => {
    let comm = new CommunicationMock();
    let $$ = unison({bird: {}})
      .plugin(client({
        communication: comm,
        commands: {}, intents: {}
      }));

    comm.pushServerString("["); // broken JSON
    comm.pushServerString("fw0ur0q923"); // not JSON
    comm.pushServerString("123"); // not a command or intent
    comm.pushServerString("[1,2,3,4]"); // bad format
    comm.pushServerCommand('bogusCommand', 'bogusObject', 'bogus'); // non-existent command

    // if we reach the end of the test, we should be OK
  });

  it("should handle '_seed' commands out of the box", () => {
    let comm = new CommunicationMock();
    let $$ = unison({})
      .plugin(client({
        communication: comm,
        commands: {},
        intents: {}
      }));

    let listener = sinon.spy();
    $$('').on('childAdded', listener);

    comm.pushServerCommand('_seed', '', {bird: {wingspan: 6}, seeded: true});

    assert.equal($$('seeded').state(), true);
    assert.equal($$('bird').state().wingspan, 6);
    assert.ok(listener.calledOnce);
  });

  it("should allow adding commands and intents after the fact", () => {
    let comm = new CommunicationMock();
    let $$ = unison({})
      .plugin(client({
        communication: comm,
        commands: {},
        intents: {}
      }));

    $$.addCommand(function() {
      this.update({frobbed: true});
    }, 'frob');
    $$.addIntent(() => {}, 'pleaseFrob');

    $$('').frob();
    $$('').pleaseFrob();

    assert.ok($$('').state().frobbed);
    assert.deepEqual(comm.sentMessages, [
      ['i', 'pleaseFrob', '', []]
    ]);
  });
});