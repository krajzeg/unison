var _ = require('lodash');

import {COMMAND, INTENT, parseMessage} from "./client-server-base";

export default function server(options) {
  let serverPlugin = new ServerPlugin(options);
  return function(...args) {
    return serverPlugin.applyPlugin.apply(serverPlugin, args);
  }
}

class ServerPlugin {
  constructor({communication, intents = {}, commands = {}}) {
    _.extend(this, {communication, intents, commands});

    this.clients = [];

    this.communication.onAttach((client) => this.attach(client));
    this.communication.onDetach((client) => this.detach(client));
    this.communication.onReceive((client, msg) => this.receive(client, msg));
  }

  applyPlugin($$) {
    this.$$ = $$;
    return {
      nodeMethods: this.generateCommandMethods()
    };
  }

  attach(client) {
    this.clients.push(client);
  }

  detach(client) {
    let position = this.clients.indexOf(client);
    if (position >= 0)
      this.clients.splice(position, 1);
  }

  receive(msgString) {
    parseMessage(msgString, (message) => {
      let [messageType] = message;
      switch (messageType) {
        case INTENT:
          return this.applyIntent(message);
        case COMMAND:
          throw new Error("Servers do not obey commands.")
      }
    });
  }

  sendToAll(message) {
    let msgString = JSON.stringify(message);
    _.each(this.clients, (client) => {
      this.communication.sendTo(client, msgString);
    });
  }

  applyIntent([code, intentName, objectPath, parameters]) {
    let intentFn = this.intents[intent];
  }

  generateCommandMethods() {
    return _.object(_.map(this.commands,
      (commandFn, commandName) => [commandName, this.makeCommandMethod(commandName, commandFn)]
    ));
  }

  makeCommandMethod(commandName, commandFn) {
    let server = this;
    return function(...parameters) {
      // 'this' refers to the Node on which the method was called here
      commandFn.apply(this, parameters); // apply the changes on the server
      server.sendToAll([COMMAND, commandName, this.path(), parameters]); // send the changes to all the clients
    }
  }
}
