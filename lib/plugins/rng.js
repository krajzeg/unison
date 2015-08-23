import _ from 'lodash';
import generators from 'rng';

import { functionized } from '../util';

export default function rng({version, seed}) {
  if (version == 'client') {
    return functionized(ClientRNGPlugin, [], 'applyPlugin');
  } else if (version == 'server') {
    return functionized(ServerRNGPlugin, [seed], 'applyPlugin');
  } else {
    throw new Error("Initialize RNG plugin either as rng({version: 'server'}) or rng({version: 'client'}).");
  }
}

let CommonRNG = {
  applyPlugin(u) {
    return {
      name: 'rng',
      methods: {
        rng: {
          u: u,
          int: this.randomInt,
          pick: this.randomPick
        }
      }
    };
  },

  randomPick(collection) {
    return collection(this.randomInt(0, collection.length))
  }
};

function ServerRNGPlugin(seed) {
  if (seed === undefined) seed = process.hrtime()[1]; // obviously, we'll want a better seed at some point
  this.generator = new generators.MT(seed);
}
ServerRNGPlugin.prototype = _.extend(Object.create(CommonRNG), {
  randomInt(low, high) {
    let u = this.u, result = low + Math.floor(u.plugins.rng.generator.uniform() * (high - low));

    // store this result in command extras to be replicated on the client
    let extras = u.plugins.server.getCommandExtras();
    if (extras.rng) {
      extras.rng.push(result);
    } else {
      extras.rng = [result];
    }

    // give the result back
    return result;
  }
});

function ClientRNGPlugin() {
}
ClientRNGPlugin.prototype = _.extend(Object.create(CommonRNG), {
  randomInt(low, high) {
    let u = this.u;

    // get the results from the server
    let results = u.plugins.client.getCommandExtras().rng;
    if (!results || (!results.length))
      throw new Error("Something went wrong with the RNG - no server results available.");

    // is it kosher?
    let result = results.shift();
    if (result < low || result >= high)
      throw new Error("Something went wrong with the RNG - server-reported results don't match the expected range.");

    // yup
    return result
  }
});
