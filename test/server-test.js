var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib/plugins/server');
var CommunicationMock = require('./mocks/server-comm');

describe("Unison network server", () => {
  it("should translate command methods into local changes and network messages to all clients", () => {
    let comm = new CommunicationMock();

    let $$ = unison({bird: {}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(howHard) {
            this.update({frobbed: howHard});
          }
        },
        intents: {}
      }));

    comm.attach('client1');
    comm.attach('client2');

    $$('bird').frob('very hard');

    assert.deepEqual($$('bird').state(), {frobbed: 'very hard'});
    assert.ok(comm.containsMessageFor('client1',
      ['c', 'frob', 'bird', ['very hard']]
    ));
    assert.ok(comm.containsMessageFor('client2',
      ['c', 'frob', 'bird', ['very hard']]
    ));
  });

  it("should translate intents from clients into command executions via the intent methods", () => {
    let comm = new CommunicationMock();

    let $$ = unison({bird: {}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(howHard, by) {
            this.update({frobbed: howHard, by: by});
          }
        },
        intents: {
          pleaseFrob(howHard, client) {
            this.frob(howHard, client);
          }
        }
      }));

    comm.attach('client1');
    comm.pushClientMessage('client1', ['i', 'pleaseFrob', 'bird', ['lightly']]);

    let bird = $$('bird').state();
    assert.equal(bird.frobbed, 'lightly');
    assert.equal(bird.by, 'client1');

    assert.ok(comm.containsMessageFor('client1',
      ['c', 'frob', 'bird', ['lightly', 'client1']]
    ));
  });

  it("should not send commands to clients that have already detached", () => {
    let comm = new CommunicationMock();

    let $$ = unison({bird: {}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(howHard) {
            this.update({frobbed: howHard});
          }
        }
      }));

    comm.attach('client1');
    $$('bird').frob('lightly');
    comm.detach('client1');
    $$('bird').frob('gently');

    var frobMessages = _.where(comm.messagesSentTo('client1'), {1: 'frob'});
    assert.equal(frobMessages.length, 1);
    assert.deepEqual(frobMessages[0], ['c', 'frob', 'bird', ['lightly']]);
  });

  it("should send a 'seed' command with the current state to newly attached clients", () => {
    let comm = new CommunicationMock();

    let $$ = unison({bird: {wingspan: 6}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(howHard) {
            this.update({frobbed: howHard});
          }
        }
      }));

    comm.attach('client1');

    var messages = comm.messagesSentTo('client1');
    assert.deepEqual(messages, [
      ['c', '_seed', '', [{bird: {wingspan: 6}}]]
    ]);
  });

});