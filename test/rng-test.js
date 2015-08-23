var _ = require('lodash');
var assert = require('chai').assert;
var unison = require('../lib');
var server = require('../lib').server;
var client = require('../lib').client;
var rng = require('../lib').rng;
var ServerCommunicationMock = require('./mocks/server-comm');
var ClientCommunicationMock = require('./mocks/client-comm');

describe("Server-side RNG", () => {
  it("should send random numbers generated in commands as command extras", () => {
    let comm = new ServerCommunicationMock();
    let u = unison({});
    u.plugin(server({
      communication: comm,
      commands: {
        rollSomeDice() {
          let u = this.u;
          let d6 = u.rng.int(1, 6+1), d12 = u.rng.int(1, 12+1);
          this.update({d6, d12});
        }
      }
    }));
    u.plugin(rng({
      version: 'server', seed: 12345
    }));

    comm.attach('client1');

    u().rollSomeDice();

    let rollMessage = comm.messagesSentTo('client1')[1];
    let extras = rollMessage[4];
    assert.ok(extras);
    assert.ok(extras.rng);
    assert.deepEqual(extras.rng, [u().get.d6, u().get.d12]);
    assert.deepEqual(extras.rng, [5, 7]);
  });
});

describe("Client-side RNG", () => {
  it("should repeat the values given by the server in extras", () => {
    let comm = new ClientCommunicationMock();
    let u = unison({});
    u.plugin(client({
      communication: comm,
      commands: {
        rollSomeDice() {
          let u = this.u;
          let d6 = u.rng.int(1, 6+1), d12 = u.rng.int(1, 12+1);
          this.update({d6, d12});
        }
      }
    }));
    u.plugin(rng({version: 'client'}));

    comm.pushServerString('["c","rollSomeDice","",[],{"rng":[5,7]}]');

    assert.equal(u().get.d6, 5);
    assert.equal(u().get.d12, 7);
  });
});
