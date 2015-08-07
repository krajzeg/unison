var _ = require('lodash');
var Promise = require('bluebird');

import {COMMAND, INTENT, RESPONSE, RESPONSE_OK, RESPONSE_ERROR, parseMessage, BUILTIN_COMMANDS, deserializeArguments, serializeArguments, serialize} from "./client-server-base";

export default function server(options) {
  let serverPlugin = new ServerPlugin(options);
  let fn = function(...args) {
    return serverPlugin.applyPlugin.apply(serverPlugin, args);
  };
  fn.plugin = serverPlugin;

  return fn;
}

class ServerPlugin {
  constructor({
    communication,
    intents = {}, commands = {},
    errorHandler = defaultErrorHandler,
    unexpectedErrorMessage = 'Oops! Something went very wrong on the server.'})
  {
    _.extend(this, {communication, intents, commands});
    _.extend(this.commands, BUILTIN_COMMANDS);
    this.config = {
      errorHandler: errorHandler,
      unexpectedErrorMessage: unexpectedErrorMessage
    };

    this.clients = [];

    this.communication.onAttach((client) => this.attach(client));
    this.communication.onDetach((client) => this.detach(client));
    this.communication.onReceive((client, msg) => this.receive(client, msg));
  }

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

  attach(client) {
    this.clients.push(client);

    let u = this.u, rootState = u('').state();
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
          throw new Error("Servers do not obey commands from clients.")
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

  sendErrorResponse(client, intentId, message) {
    this.sendTo(client, [RESPONSE, RESPONSE_ERROR, intentId, message]);
  }

  sendOkResponse(client, intentId, result) {
    this.sendTo(client, [RESPONSE, RESPONSE_OK, intentId, serialize(result)]);
  }

  applyIntent(client, [code, intentName, objectPath, args, intentId]) {
    let intentFn = this.intents[intentName];
    let u = this.u, target = u(objectPath);

    args = deserializeArguments(u, args);
    let fullArgs = args.concat(client);

    let runIntent = new Promise((resolve, reject) => {
      try {
        let result = intentFn.apply(target, fullArgs);
        return resolve(result);
      } catch (err) {
        return reject(err);
      }
    });

    return runIntent.then((result) => {
      this.sendOkResponse(client, intentId, result);
    }).catch((err) => {
      if (err.reportToUser) {
        this.sendErrorResponse(client, intentId, err.message);
      } else {
        this.sendErrorResponse(client, intentId, this.config.unexpectedErrorMessage);
        this.config.errorHandler(err);
      }
    });
  }

  addNodeMethods() {
    _.each(this.commands, (cmd, name) => { this.addCommand(name, cmd); });
    _.each(this.intents, (i, name) => { this.addIntent(name, i); });
  }

  addCommand(commandName, commandCode) {
    this.u.registerNodeProperties({
      [commandName]: this.makeCommandMethod(commandName, commandCode)
    });
  }

  addIntent(intentName, intentCode) {
    this.u.registerNodeProperties({
      [intentName]: intentCode
    });
  }

  makeCommandMethod(commandName, commandFn) {
    let server = this;
    return function(...args) {
      // 'this' refers to the Node on which the method was called here
      commandFn.apply(this, args); // apply the changes on the server
      server.sendToAll([COMMAND, commandName, this.path(), serializeArguments(args)]); // send the changes to all the clients
    }
  }
}

function defaultErrorHandler(err) {
  console.error(err.stack || err);
}