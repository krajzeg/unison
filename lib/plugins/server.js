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

    this.clientObjects = {};

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

  attach(clientId) {
    this.clientObjects[clientId] = {id: clientId};

    let u = this.u;

    let seedInformation = _.extend({}, u().state()); // independent copy to keep original state intact
    delete seedInformation['local']; // anything under 'local' is not propagated to the clients

    this.sendTo(clientId, [cs.COMMAND, '_seed', '', [seedInformation]]);
  }

  detach(clientId) {
    delete this.clientObjects[clientId];
  }

  receive(clientId, msgString) {
    cs.parseMessage(msgString, (message) => {
      let [messageType] = message;
      switch (messageType) {
        case cs.INTENT:
          return this.applyIntent(clientId, message);
        case cs.COMMAND:
          throw new Error("Servers do not obey commands from clients.")
      }
    });
  }

  sendToAll(message) {
    let msgString = JSON.stringify(message);
    _.each(this.clientObjects, ({id}) => {
      this.communication.sendTo(id, msgString);
    });
  }

  sendTo(clientId, message) {
    let msgString = JSON.stringify(message);
    this.communication.sendTo(clientId, msgString);
  }

  sendErrorResponse(clientId, intentId, message) {
    this.sendTo(clientId, [cs.RESPONSE, cs.RESPONSE_ERROR, intentId, message]);
  }

  sendOkResponse(clientId, intentId, result) {
    this.sendTo(clientId, [cs.RESPONSE, cs.RESPONSE_OK, intentId, cs.serialize(result)]);
  }

  applyIntent(clientId, [code, intentName, objectPath, args, intentId]) {
    let intentFn = this.intents[intentName];
    let u = this.u, target = u(objectPath);

    args = cs.deserializeAll(u, args);
    let fullArgs = args.concat(this.clientObjects[clientId]);

    let runIntent = new Promise((resolve, reject) => {
      try {
        let result = intentFn.apply(target, fullArgs);
        return resolve(result);
      } catch (err) {
        return reject(err);
      }
    });

    return runIntent.then((result) => {
      this.sendOkResponse(clientId, intentId, result);
    }).catch((err) => {
      if (err.reportToUser) {
        this.sendErrorResponse(clientId, intentId, err.message);
      } else {
        this.sendErrorResponse(clientId, intentId, this.config.unexpectedErrorMessage);
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
      // handle nested executions
      let nested = !!server._runningCommand;
      if (!nested)
        server._runningCommand = [this, commandName, args];

      // execute the command, trigger events
      try {
        this.trigger('before:' + commandName, {args: args});
        commandFn.apply(this, args);
        this.trigger('after:' + commandName, {args: args});
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