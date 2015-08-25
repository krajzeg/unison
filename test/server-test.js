var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib').server;
var sinon = require('sinon');
var Promise = require('bluebird');
var CommunicationMock = require('./mocks/server-comm');

describe("Server plugin", () => {
  it("should translate command methods into local changes and network messages to all clients", () => {
    let comm = new CommunicationMock();

    let u = unison({bird: {}})
    u.define({
      commands: {
        frob(howHard) {
          this.update({frobbed: howHard});
        }
      }
    });
    u.plugin(server({communication: comm}));

    comm.attach('client1');
    comm.attach('client2');

    u('bird').frob('very hard');

    assert.deepEqual(u('bird').get, {frobbed: 'very hard'});
    assert.ok(comm.containsMessageFor('client1',
      ['c', 'frob', 'bird', ['very hard']]
    ));
    assert.ok(comm.containsMessageFor('client2',
      ['c', 'frob', 'bird', ['very hard']]
    ));
  });

  it("should translate intents from clients into command executions via the intent methods", () => {
    let comm = new CommunicationMock();

    let u = unison({bird: {}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(howHard, by) {
            this.update({frobbed: howHard, by: by});
          }
        },
        intents: {
          pleaseFrob(howHard, client) {
            this.frob(howHard, client.id);
          }
        }
      }));

    comm.attach('client1');
    comm.pushClientMessage('client1', ['i', 'pleaseFrob', 'bird', ['lightly'], 1]);

    let bird = u('bird').get;
    assert.equal(bird.frobbed, 'lightly');
    assert.equal(bird.by, 'client1');

    assert.ok(comm.containsMessageFor('client1',
      ['c', 'frob', 'bird', ['lightly', 'client1']]
    ));
  });

  it("should let intents store data on the client objects", () => {
    let comm = new CommunicationMock();

    let counterValues = {};

    let u = unison({})
      .plugin(server({
        communication: comm,
        intents: {
          pleaseBumpCounter(client) {
            client.counter = client.counter ? client.counter + 1 : 1;
            counterValues[client.id] = client.counter;
          }
        }
      }));

    comm.attach('client1'); comm.attach('client2');
    comm.pushClientMessage('client1', ['i', 'pleaseBumpCounter', '', [], 1]);
    comm.pushClientMessage('client2', ['i', 'pleaseBumpCounter', '', [], 2]);
    comm.pushClientMessage('client1', ['i', 'pleaseBumpCounter', '', [], 3]);

    assert.equal(counterValues['client1'], 2);
    assert.equal(counterValues['client2'], 1);
  });

  it("should trigger before:X/after:X events on all command executions", () => {
    let comm = new CommunicationMock();
    let u = unison({})
    u.plugin(server({
      communication: comm,
      commands: {
        frob() {
          this.update({frobbed: true});
          this.futz();
        },
        futz() {
          this.update({futzed: true});
        }
      }
    }));

    let calls = [], events = ['before:frob', 'after:frob', 'before:futz', 'after:futz']
    _.map(events, (event) => {
      u().on(event, function(evt) {
        calls.push(evt.name);
      });
    });

    u().frob();

    assert.deepEqual(calls, ['before:frob', 'before:futz', 'after:futz', 'after:frob']);
  });

  it("should not send commands nested in other command executions", () => {
    let comm = new CommunicationMock();
    let u = unison({})
      .plugin(server({
        communication: comm,
        commands: {
          frob() {
            this.update({frobbed: true});
            this.futz();
          },
          futz() {
            this.update({futzed: true});
          }
        }
      }));

    comm.attach('client1');
    u().frob();

    let messages = comm.messagesSentTo('client1').slice(1); // remove the _seed command
    assert.equal(messages.length, 1);
    assert.deepEqual(messages[0], ['c', 'frob', '', []]);
    assert.deepEqual(u().state(), {frobbed: true, futzed: true});
  });

  it("should not send commands to clients that have already detached", () => {
    let comm = new CommunicationMock();

    let u = unison({bird: {}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(howHard) {
            this.update({frobbed: howHard});
          }
        }
      }));

    comm.attach('client1');
    u('bird').frob('lightly');
    comm.detach('client1');
    u('bird').frob('gently');

    var frobMessages = _.where(comm.messagesSentTo('client1'), {1: 'frob'});
    assert.equal(frobMessages.length, 1);
    assert.deepEqual(frobMessages[0], ['c', 'frob', 'bird', ['lightly']]);
  });

  it("should send a '_seed' command with the current state to newly attached clients", () => {
    let comm = new CommunicationMock();

    let u = unison({bird: {wingspan: 6}})
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

  it("should not propagate state under 'local' through the '_seed' command", () => {
    let comm = new CommunicationMock();

    let u = unison({
      answer: 42,
      local: {should: ['not', 'be', 'propagated']}
    });
    u.plugin(server({communication: comm}));

    comm.attach('client1');

    var messages = comm.messagesSentTo('client1');
    assert.deepEqual(messages, [
      ['c', '_seed', '', [{answer: 42}]]
    ]);
  });

  it("should allow adding commands and intents after the fact", () => {
    let comm = new CommunicationMock();
    let u = unison({bird: {}})
      .plugin(server({communication: comm}));

    u.addIntent('pleaseFrob', function() { this.frob(); });
    u.addCommand('frob', function() { this.update({frobbed: true}); });

    u('bird').pleaseFrob();

    assert.ok(u('bird').get.frobbed);
  });

  it("should serialize and deserialize objects over the network correctly", () => {
    let comm = new CommunicationMock();

    let u = unison({bird: {}, human: {}})
      .plugin(server({
        communication: comm,
        commands: {
          frob(who) { who.update({frobbedBy: this.path()}); }
        },
        intents: {
          pleaseFrob(who) {
            this.frob(who);
          }
        }
      }));

    comm.attach('client1');
    comm.pushClientMessage('client1', ['i', 'pleaseFrob', 'bird', [{_u: 'human'}], 1]);

    assert.equal(u('human').get.frobbedBy, 'bird');
    assert.ok(comm.containsMessageFor('client1',
      ['c', 'frob', 'bird', [{_u: 'human'}]]
    ));
  });

  it("should send correct responses when an intent function returns a value", (done) => {
    let comm = new CommunicationMock();

    let srv = server({
      communication: comm,
      intents: {
        pleaseFrob() {
          return "Frobbed!";
        }
      }
    });
    let u = unison({}).plugin(srv);
    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(() => {
      assert.ok(comm.containsMessageFor('client1',
        ['r', 'ok', 1, "Frobbed!"]
      ));
    }).then(done).catch(done);
  });

  it("should act correctly when an intent function returns a promise", (done) => {
    let comm = new CommunicationMock();

    let srv = server({
      communication: comm,
      intents: {
        pleaseFrob() {
          return wait(10).then(() => "Frobbed!");
        }
      }
    });
    let u = unison({}).plugin(srv);
    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(() => {
      assert.ok(comm.containsMessageFor('client1',
        ['r', 'ok', 1, "Frobbed!"]
      ));
    }).then(done).catch(done);
  });

  it("should send correct responses when an intent function unexpectedly fails", (done) => {
    let comm = new CommunicationMock(), errorSpy = sinon.spy();

    let srv = server({
      communication: comm,
      intents: {
        pleaseFrob() {
          throw new Error("It hurts a lot.")
        }
      },
      unexpectedErrorMessage: 'Argh!',
      errorHandler: errorSpy
    });

    let u = unison({}).plugin(srv);
    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(() => {
      assert.ok(comm.containsMessageFor('client1',
        ['r', 'err', 1, "Argh!"]
      ));
      assert.ok(errorSpy.calledOnce);
    }).then(done).catch(done);

  });

  it("should send correct responses when an intent function throws a UserError", (done) => {
    let comm = new CommunicationMock(), errorSpy = sinon.spy();
    let srv = server({
      communication: comm,
      intents: {
        pleaseFrob() {
          throw new unison.UserError("Not frobbable.")
        }
      },
      errorHandler: errorSpy
    });

    let u = unison({}).plugin(srv);
    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', '', [], 1]).then(() => {
      assert.ok(comm.containsMessageFor('client1',
        ['r', 'err', 1, "Not frobbable."]
      ));
      assert.ok(!errorSpy.called);
    }).then(done).catch(done);
  });

  it("should serialize objects returned from intents", (done) => {
    let comm = new CommunicationMock();

    let srv = server({
      communication: comm,
      intents: {
        pleaseFrob() {
          return this;
        }
      }
    });
    let u = unison({cockatoo: {}}).plugin(srv);
    comm.attach('client1');

    u.plugins.server.applyIntent('client1', ['i', 'pleaseFrob', 'cockatoo', [], 1]).then(() => {
      assert.ok(comm.containsMessageFor('client1',
        ['r', 'ok', 1, {_u: 'cockatoo'}]
      ));
    }).then(done).catch(done);
  });

  it("should let us recognize that we're on the serverside", () => {
    let comm = new CommunicationMock();
    let u = unison({}).plugin(server({communication: comm}));

    assert.ok(u.serverSide);
  });

  it("should allow extra information to be sent along with commands by other plugins", () => {
    let comm = new CommunicationMock();
    let u = unison({}).plugin(server({
      communication: comm,
      commands: {
        applySpecialSauce() {
          let u = this.u;
          u.plugins.server.getCommandExtras().specialSauce = 'applied';
        }
      }
    }));

    comm.attach('client1');
    u().applySpecialSauce();

    assert.ok(comm.containsMessageFor('client1',
      ['c', 'applySpecialSauce', '', [], {specialSauce: 'applied'}]
    ));
  });

});

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}