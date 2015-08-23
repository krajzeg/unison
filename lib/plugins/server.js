var _ = require('lodash');
var Promise = require('bluebird');

let cs = require("./client-server-base");
import { functionized } from '../util';

export default function server(options) {
  return functionized(ServerPlugin, [options], 'applyPlugin');
}

function ServerPlugin({
  communication,
  intents = {}, commands = {},
  errorHandler = defaultErrorHandler,
  unexpectedErrorMessage = 'Oops! Something went very wrong on the server.'}) {
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
ServerPlugin.prototype = {
  applyPlugin(u) {
    this.u = u;
    this.addNodeMethods();

    return {
      name: 'server',
      methods: {
        addIntent: this.addIntent.bind(this),
        addCommand: this.addCommand.bind(this),

        serverSide: true
      }
    };
  },

  attach(clientId) {
    this.clientObjects[clientId] = {id: clientId};

    let u = this.u;

    let seedInformation = _.extend({}, u().state()); // independent copy to keep original state intact
    delete seedInformation['local']; // anything under 'local' is not propagated to the clients

    this.sendTo(clientId, [cs.COMMAND, '_seed', '', [seedInformation]]);
  },

  detach(clientId) {
    delete this.clientObjects[clientId];
  },

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
  },

  sendToAll(message) {
    let msgString = JSON.stringify(message);
    _.each(this.clientObjects, ({id}) => {
      this.communication.sendTo(id, msgString);
    });
  },

  sendTo(clientId, message) {
    let msgString = JSON.stringify(message);
    this.communication.sendTo(clientId, msgString);
  },

  sendErrorResponse(clientId, intentId, message) {
    this.sendTo(clientId, [cs.RESPONSE, cs.RESPONSE_ERROR, intentId, message]);
  },

  sendOkResponse(clientId, intentId, result) {
    this.sendTo(clientId, [cs.RESPONSE, cs.RESPONSE_OK, intentId, cs.serialize(result)]);
  },

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
  },

  addNodeMethods() {
    _.each(this.commands, (cmd, name) => { this.addCommand(name, cmd); });
    _.each(this.intents, (i, name) => { this.addIntent(name, i); });
  },

  addCommand(commandName, commandCode) {
    this.u.registerNodeProperties({
      [commandName]: this.makeCommandMethod(commandName, commandCode)
    });
  },

  addIntent(intentName, intentCode) {
    this.u.registerNodeProperties({
      [intentName]: intentCode
    });
  },

  makeCommandMethod(commandName, commandFn) {
    let server = this;

    return function(...args) {
      // handle nested executions (command executed from another command)
      // commands nested in other commands are not sent to clients (since they will
      // execute them on their own when the top-level command runs)
      let nested = !!server._runningCommand;
      if (!nested)
        server._runningCommand = {target: this, command: commandName, args, extras: {}};

      try {
        // execute the command, trigger events
        this.trigger('before:' + commandName, {args: args});
        commandFn.apply(this, args);
        this.trigger('after:' + commandName, {args: args});
      } catch(e) {
        // on error, we have to reset the runningCommand
        if (!nested)
          server._runningCommand = null;
        // but the error is still thrown
        throw e;
      }

      if (!nested) {
        // not a nested execution, so this command will be sent to the client
        let commandForClients = [cs.COMMAND, commandName, this.path(), cs.serializeAll(args)];

        // during the execution of some commands, extra information might be generated that needs to be sent to the client
        // currently, this is used by the deterministic RNG module to make sure clients generate the same random numbers
        // as the server
        let extras = server._runningCommand.extras;
        if (_.size(extras))
          commandForClients.push(extras);

        // send the command to all clients
        server.sendToAll(commandForClients);

        // we're done running
        server._runningCommand = null;
      }
    }
  },

  getRunningCommand() { return this._runningCommand; },
  getCommandExtras() {
    if (!this._runningCommand)
      throw new Error("There is no command running for extras to be attached to.");
    return this._runningCommand.extras;
  }
};

function defaultErrorHandler(err) {
  console.error(err.stack || err);
}