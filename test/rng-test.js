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
    u.plugin(server({communication: comm}));
    u.plugin(rng({version: 'server', seed: 12345}));
    u.define({
      commands: {
        rollSomeDice() {
          let u = this.u;
          let d6 = u.rng.int(1, 6+1), d12 = u.rng.int(1, 12+1);
          this.update({d6, d12});
        }
      }
    });

    comm.attach('client1');

    u().rollSomeDice();

    let rollMessage = comm.messagesSentTo('client1')[1];
    let extras = rollMessage[4];
    assert.ok(extras);
    assert.ok(extras.rng);
    assert.deepEqual(extras.rng, [u().get.d6, u().get.d12]);
    assert.deepEqual(extras.rng, [5, 7]);
  });

  it("should send correct extras for rng.pick()", () => {
    let comm = new ServerCommunicationMock();
    let u = unison({});
    u.plugin(server({communication: comm}));
    u.plugin(rng({version: 'server', seed: 12345}));
    u.define({
      commands: {
        pickOne() {
          let u = this.u, picked = u.rng.pick([3, 4, 5, 6, 7]);
          this.update({picked});
        }
      }
    });

    comm.attach('client1');

    u().pickOne();

    let pickMessage = comm.messagesSentTo('client1')[1];
    let extras = pickMessage[4];
    assert.deepEqual(extras.rng, [u().get.picked - 3]);
    assert.deepEqual(extras.rng, [3]);
    assert.equal(u().get.picked, 6);
  });

  it("should shuffle correctly", () => {
    let comm = new ServerCommunicationMock();
    let u = unison({});
    u.plugin(server({communication: comm}));
    u.plugin(rng({version: 'server', seed: 12346}));
    u.define({
      commands: {
        shuffle() {
          let u = this.u, shuffled = u.rng.shuffle([1,2,3,4,5]);
          this.update({shuffled});
        }
      }
    });

    comm.attach('client1');

    u().shuffle();

    assert.sameMembers(u().get.shuffled, [1,2,3,4,5]);

    let pickMessage = comm.messagesSentTo('client1')[1];
    let extras = pickMessage[4];
    assert.ok(extras.rng);
    assert.lengthOf(extras.rng, 4); // shuffling 5 elements requires 4 picks
  });
});

describe("Client-side RNG", () => {
  it("should repeat the values given by the server in extras", () => {
    let comm = new ClientCommunicationMock();
    let u = unison({});
    u.plugin(client({communication: comm}));
    u.plugin(rng({version: 'client'}));
    u.define({
      commands: {
        rollSomeDice() {
          let u = this.u;
          let d6 = u.rng.int(1, 6+1), d12 = u.rng.int(1, 12+1);
          this.update({d6, d12});
        }
      }
    });

    comm.pushServerString('["c","rollSomeDice","",[],{"rng":[5,7]}]');

    assert.equal(u().get.d6, 5);
    assert.equal(u().get.d12, 7);
  });

  it("should repeat collection picks made by the server", () => {
    let comm = new ClientCommunicationMock();
    let u = unison({});
    u.plugin(client({communication: comm}));
    u.plugin(rng({version: 'client'}));
    u.define({
      commands: {
        pickOne() {
          let u = this.u, picked = u.rng.pick([3, 4, 5, 6, 7]);
          this.update({picked});
        }
      }
    });

    comm.pushServerString('["c","pickOne","",[],{"rng":[3]}]');

    assert.equal(u().get.picked, 6);
  });
});
