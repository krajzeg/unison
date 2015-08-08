let _ = require('lodash');
let Promise = require('bluebird');

import * as cs from "./client-server-base";

export default function client(options) {
  let clientPlugin = new ClientPlugin(options);
  return function(...args) {
    return clientPlugin.applyPlugin.apply(clientPlugin, args);
  }
}

class ClientPlugin {
  constructor({communication, intents = {}, commands = {}}) {
    _.extend(this, {
      communication, intents, commands,

      _nextIntentId: 1,
      _pendingIntents: {}
    });
    _.extend(this.commands, cs.BUILTIN_COMMANDS);

    this.communication.onReceive((msg) => this.receive(msg));
  }

  // Send a message over the provided 'communication' object.
  send(message) {
    let msgString = JSON.stringify(message);
    this.communication.send(msgString);
  }

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
  }

  // This method is called (indirectly) by u.plugin(client).
  applyPlugin(u) {
    this.u = u;

    this.addNodeMethods();

    return {
      methods: {
        addIntent: this.addIntent.bind(this),
        addCommand: this.addCommand.bind(this)
      }
    };
  }

  // Generates a map of methods that will send named intents when called.
  addNodeMethods() {
    _.each(this.intents, (i, name) => { this.addIntent(name, i); });
    _.each(this.commands, (c, name) => { this.addCommand(name, c); });
  }

  // Adds a new intent, including a method on nodes.
  addIntent(intentName, _) {
    this.u.registerNodeProperties({
      [intentName]: this.makeIntentMethod(intentName)
    });
  }

  // Adds a new command, including a method on nodes.
  addCommand(commandName, commandCode) {
    this.u.registerNodeProperties({
      [commandName]: commandCode
    });
  }

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
  }

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
  }

  // Applies a command received from the server to the local state.
  applyCommand([code, commandName, objectPath, args]) {
    // find the right one
    let command = this.commands[commandName];
    if (!command)
      throw new Error(`Received unknown command: '${commandName}'.`);

    let u = this.u;
    let target = u(objectPath);
    args = cs.deserializeAll(u, args);

    return command.apply(target, args);
  }
}

