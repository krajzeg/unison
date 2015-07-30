var _ = require('lodash');

import {COMMAND, INTENT, parseMessage, BUILTIN_COMMANDS} from "./client-server-base";

export default function server(options) {
  let serverPlugin = new ServerPlugin(options);
  return function(...args) {
    return serverPlugin.applyPlugin.apply(serverPlugin, args);
  }
}

class ServerPlugin {
  constructor({communication, intents = {}, commands = {}}) {
    _.extend(this, {communication, intents, commands});
    _.extend(this.commands, BUILTIN_COMMANDS);

    this.clients = [];

    this.communication.onAttach((client) => this.attach(client));
    this.communication.onDetach((client) => this.detach(client));
    this.communication.onReceive((client, msg) => this.receive(client, msg));
  }

  applyPlugin($$) {
    this.$$ = $$;
    this.addNodeMethods();

    return {
      methods: {
        addIntent: this.addIntent.bind(this),
        addCommand: this.addCommand.bind(this)
      }
    };
  }

  attach(client) {
    this.clients.push(client);

    let $$ = this.$$, rootState = $$('').state();
    this.sendTo(client, [COMMAND, '_seed', '', [rootState]]);
  }

  detach(client) {
    let position = this.clients.indexOf(client);
    if (position >= 0)
      this.clients.splice(position, 1);
  }

  receive(client, msgString) {
    parseMessage(msgString, (message) => {
      let [messageType] = message;
      switch (messageType) {
        case INTENT:
          return this.applyIntent(client, message);
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

  sendTo(client, message) {
    let msgString = JSON.stringify(message);
    this.communication.sendTo(client, msgString);
  }

  applyIntent(client, [code, intentName, objectPath, parameters]) {
    let intentFn = this.intents[intentName];
    let $$ = this.$$, target = $$(objectPath);

    let fullParameters = parameters.concat(client);
    return intentFn.apply(target, fullParameters);
  }

  addNodeMethods() {
    _.each(this.commands, this.addCommand.bind(this));
    _.each(this.intents, this.addIntent.bind(this));
  }

  addCommand(commandCode, commandName) {
    this.$$.registerNodeProperties({
      [commandName]: this.makeCommandMethod(commandName, commandCode)
    });
  }

  addIntent(intentCode, intentName) {
    this.$$.registerNodeProperties({
      [intentName]: intentCode
    });
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
