var _ = require('lodash');

import {COMMAND, INTENT, parseMessage, serializeArguments, deserializeArguments, BUILTIN_COMMANDS} from "./client-server-base";

export default function client(options) {
  let clientPlugin = new ClientPlugin(options);
  return function(...args) {
    return clientPlugin.applyPlugin.apply(clientPlugin, args);
  }
}

class ClientPlugin {
  constructor({communication, intents = {}, commands = {}}) {
    _.extend(this, {communication, intents, commands});

    _.extend(this.commands, BUILTIN_COMMANDS);
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
    parseMessage(msgString, (message) => {
      let [messageType] = message;
      switch(messageType) {
        case COMMAND:
          return this.applyCommand(message);
        case INTENT:
          throw new Error("Intents should not be sent to clients.")
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
      let intent = [INTENT, intentName, this.path(), serializeArguments(args)];
      client.send(intent);
    }
  }

  // Applies a command received from the server to the local state.
  applyCommand([code, commandName, objectPath, args]) {
    // find the right one
    let command = this.commands[commandName];
    if (!command)
      throw new Error(`Received unknown command: '${commandName}'.`);

    let u = this.u;
    let target = u(objectPath);
    args = deserializeArguments(u, args);

    return command.apply(target, args);
  }
}

/*
 intent:
 function moveMagnet(clientId, umagnet, newPosition) {
 umagnet.moveTo(newPosition);
 }

 command:
 function moveTo(umagnet, newPosition) {
 umagnet.update({x: newPosition.x, y: newPosition.y});
 }

 tryMovingMagnet(clientId, newPosition) {
  this.command.moveTo(newPosition);
 }
 moveMagnetTo(newPosition) {
  this.update({x: newPosition.x, y: newPosition.y})
 }

magnet.intent.move({x: 12, y: 44});
 */


/*

 COMMUNICATION LOGIC:
 client - intent method:   send [object, intent, parameters] to the server
 client - command method:  < not present >
 client - apply intent:    < not present >
 client - apply command:   execute the code

 server - intent method:   virtual send [object, intent, parameters] to yourself
 server - apply intent:    execute the code, calling one or more command method or rejecting the intent
 server - command method:  execute the code, send [object, command, parameters] to all clients
 server - apply command:   < not present >

 intent code - runs on the server, translates intent into commands
 command code - runs on both, applies changes to state
 */
