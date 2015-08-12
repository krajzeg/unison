var _ = require('lodash');
var Promise = require('bluebird');

let cs = require("./client-server-base");

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
    _.extend(this.commands, cs.BUILTIN_COMMANDS);
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
    this.sendTo(client, [cs.COMMAND, '_seed', '', [rootState]]);
  }

  detach(client) {
    let position = this.clients.indexOf(client);
    if (position >= 0)
      this.clients.splice(position, 1);
  }

  receive(client, msgString) {
    cs.parseMessage(msgString, (message) => {
      let [messageType] = message;
      switch (messageType) {
        case cs.INTENT:
          return this.applyIntent(client, message);
        case cs.COMMAND:
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
    this.sendTo(client, [cs.RESPONSE, cs.RESPONSE_ERROR, intentId, message]);
  }

  sendOkResponse(client, intentId, result) {
    this.sendTo(client, [cs.RESPONSE, cs.RESPONSE_OK, intentId, cs.serialize(result)]);
  }

  applyIntent(client, [code, intentName, objectPath, args, intentId]) {
    let intentFn = this.intents[intentName];
    let u = this.u, target = u(objectPath);

    args = cs.deserializeAll(u, args);
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
      let nested = !!server._runningCommand;
      if (!nested)
        server._runningCommand = [this, commandName, args];
      // 'this' refers to the Node on which the method was called here
      try {
        commandFn.apply(this, args)
      } catch(e) {
        if (!nested)
          server._runningCommand = null;
        throw e;
      }

      if (!nested) {
        server.sendToAll([cs.COMMAND, commandName, this.path(), cs.serializeAll(args)]); // send the changes to all the clients
        server._runningCommand = null;
      }
    }
  }
}

function defaultErrorHandler(err) {
  console.error(err.stack || err);
}