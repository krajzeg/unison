var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib/plugins/server');
var CommunicationMock = require('./mocks/server-comm');

describe("Unison network server", () => {
  it("should translate command methods into local changes and network messages properly", () => {
    let comm = new CommunicationMock();

    let $$ = unison
      .local({bird: {}})
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
    assert.deepEqual(comm.messagesSentTo('client1'), [
      ['c', 'frob', 'bird', ['very hard']]
    ]);
    assert.deepEqual(comm.messagesSentTo('client2'), [
      ['c', 'frob', 'bird', ['very hard']]
    ]);
  });
});
