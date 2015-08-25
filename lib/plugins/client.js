let _ = require('lodash');
let Promise = require('bluebird');

let cs = require("./client-server-base");
import { functionized } from '../util';

export default function client(options) {
  return functionized(ClientPlugin, [options], 'applyPlugin');
}

function ClientPlugin({communication}) {
  _.extend(this, {
    communication,

    _nextIntentId: 1,
    _pendingIntents: {}
  });

  this.communication.onReceive((msg) => this.receive(msg));
}
ClientPlugin.prototype = {
  // Send a message over the provided 'communication' object.
  send(message) {
    let msgString = JSON.stringify(message);
    this.communication.send(msgString);
  },

  // Called whenever a message is receive on the 'communication' object, will execute
  // commands receive from the server in response.
  receive(msgString) {
    cs.parseMessage(msgString, (message) => {
      let [messageType] = message;
      switch(messageType) {
        case cs.COMMAND:
          return this.applyCommand(message);
        case cs.INTENT:
          throw new Error("Intents should not be sent to clients.")
        case cs.RESPONSE:
          return this.applyIntentResponse(message);
      }
    });
  },

  // This method is called (indirectly) by u.plugin(client).
  applyPlugin(u) {
    this.u = u;

    u.define({commands: cs.BUILTIN_COMMANDS}); // add the _seed command by default

    return {
      name: 'client',

      onDefine: this.processDefinitions.bind(this),

      methods: {
        clientSide: true
      }
    };
  },

  // Generates a map of methods that will send named intents when called.
  processDefinitions(typeName, definitions, prototype) {
    let intentMethods = _.mapValues(definitions.intents || {}, (intentCode, name) =>
      this.makeIntentMethod(name)
    );
    let commandMethods = _.mapValues(definitions.commands || {}, (cmdCode, name) =>
      this.makeCommandMethod(name, cmdCode)
    );
    _.extend(prototype, intentMethods, commandMethods);
  },

  // Generates a method that executes a command and triggers events about it.
  makeCommandMethod(commandName, commandCode) {
    return function(...args) {
      this.trigger('before:' + commandName, {args: args});
      let result = commandCode.apply(this, args);
      this.trigger('after:' + commandName, {args: args});
      return result;
    }
  },

  // Generates a method that will send a named intent with the right parameters when called.
  makeIntentMethod(intentName) {
    let client = this;
    return function(...args) {
      // this here will be the node we're called upon
      let intentId = client._nextIntentId++;
      let intent = [cs.INTENT, intentName, this.path(), cs.serializeAll(args), intentId];
      client.send(intent);

      return new Promise((resolve, reject) => {
        client._pendingIntents[intentId] = {name: intentName, target: this, resolve: resolve, reject: reject};
      });
    }
  },

  // Applies a response to an intent sent earlier.
  applyIntentResponse([code, status, intentId, resultOrMessage]) {
    let intent = this._pendingIntents[intentId];
    if (!intent)
      throw new Error(`Received response to an unknown or expired intent: ${intentId}.`);

    if (status == cs.RESPONSE_OK) {
      intent.resolve(cs.deserialize(this.u, resultOrMessage));
    } else if (status == cs.RESPONSE_ERROR) {
      intent.reject({intent: intent.name, target: intent.target, message: resultOrMessage});
      intent.target.trigger('error', {intent: intent.name, message: resultOrMessage});
    } else {
      throw new Error(`Unrecognized intent response status: ${status}.`);
    }

    delete this._pendingIntents[intentId];
  },

  // Applies a command received from the server to the local state.
  applyCommand([messageCode, commandName, objectPath, args, optionalExtras]) {
    // extract the information from the command
    let u = this.u;
    let target = u(objectPath);
    args = cs.deserializeAll(u, args);

    // ensure the command's existence
    if (!target[commandName])
      throw new Error(`Received unknown command: '${commandName}'.`);

    // if extras were sent, make them available to client-side plugins for perusal
    // otherwise, set an empty object to make it easy to use
    this._commandExtras = optionalExtras || {};

    try {
      // run the command!
      let result = target[commandName].apply(target, args);
      // clean up and return result
      delete this._commandExtras;
      return result;
    } catch(e) {
      // clean up on error and rethrow
      delete this._commandExtras;
      throw e;
    }
  },

  // Returns the extras sent by the server for the currently running command
  getCommandExtras() {
    if (!this._commandExtras)
      throw new Error("There is no command currently running, no extras are available.");
    return this._commandExtras;
  }
};
