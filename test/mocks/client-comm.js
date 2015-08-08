var _ = require('lodash');

export default class ClientCommMock {
  constructor() {
    _.extend(this, {
      sentMessages: [],
      sentMessageStrings: []
    });
  }

  send(message) {
    this.sentMessageStrings.push(message);
    this.sentMessages.push(JSON.parse(message));
  }

  onReceive(callback) {
    this.receiveCallback = callback;
  }

  pushServerCommand(commandName, objectPath, ...parameters) {
    this.pushServerString(JSON.stringify(
      ['c', commandName, objectPath, parameters]
    ));
  }

  pushServerResponse(status, intentId, resultOrMessage) {
    this.pushServerString(JSON.stringify(
      ['r', status, intentId, resultOrMessage]
    ));
  }

  pushServerString(msgString) {
    this.receiveCallback(msgString);
  }
}
