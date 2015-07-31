var assert = require('chai').assert;
var unison = require('../lib');
var client = require('../lib').client;
var sinon = require('sinon');
var CommunicationMock = require('./mocks/client-comm');

describe("Client plugin", () => {
  it("should translate intent methods into network messages properly", () => {
    let comm = new CommunicationMock();

    let u = unison({bird: {}})
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

    u('bird').frob('very hard');
    u('bird').ageBy(5, 'years');

    assert.deepEqual(comm.sentMessages, [
     ['i', 'frob', 'bird', ['very hard']],
     ['i', 'ageBy', 'bird', [5, 'years']]
    ]);
  });

  it("should translate command methods into simple executions", () => {
    let comm = new CommunicationMock();
    let u = unison({})
      .plugin(client({
        communication: comm,
        commands: {
          frob() {
            this.update({frobbed: true});
          }
        },
        intents: {}
      }));

    u('').frob();
    assert.ok(u('').get.frobbed);
    assert.deepEqual(comm.sentMessages, []);
  });

  it("should apply commands sent by the server", () => {
    let comm = new CommunicationMock();
    let u = unison({bird: {}})
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

    assert.equal(u('bird').get.frobbed, 'very hard');
  });

  it("should not break on receiving various broken messages", () => {
    let comm = new CommunicationMock();
    let u = unison({bird: {}})
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
    let u = unison({})
      .plugin(client({
        communication: comm,
        commands: {},
        intents: {}
      }));

    let listener = sinon.spy();
    u('').on('childAdded', listener);

    comm.pushServerCommand('_seed', '', {bird: {wingspan: 6}, seeded: true});

    assert.equal(u('seeded').get, true);
    assert.equal(u('bird').get.wingspan, 6);
    assert.ok(listener.calledOnce);
  });

  it("should allow adding commands and intents after the fact", () => {
    let comm = new CommunicationMock();
    let u = unison({})
      .plugin(client({
        communication: comm,
        commands: {},
        intents: {}
      }));

    u.addCommand('frob', function() {
      this.update({frobbed: true});
    });
    u.addIntent('pleaseFrob', () => {});

    u('').frob();
    u('').pleaseFrob();

    assert.ok(u('').get.frobbed);
    assert.deepEqual(comm.sentMessages, [
      ['i', 'pleaseFrob', '', []]
    ]);
  });
});