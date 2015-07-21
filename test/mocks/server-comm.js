export default class ServerCommMock {
  constructor() {
    this.clients = [];
    this.sentPerClient = {};
    this.callbacks = {};
  }

  attach(clientId) {
    this.callbacks.onAttach(clientId);
  }

  detach(clientId) {
    this.callbacks.onDetach(clientId);
  }

  sendTo(clientId, msgString) {
    let message = JSON.parse(msgString);
    if (!this.sentPerClient[clientId])
      this.sentPerClient[clientId] = [];
    this.sentPerClient[clientId].push(message);
  }

  messagesSentTo(clientId) {
    return this.sentPerClient[clientId] || [];
  }

  containsMessageFor(clientId, message) {
    return this.sentPerClient[clientId].some((msg) =>
      JSON.stringify(msg) == JSON.stringify(message)
    );
  }

  pushClientMessage(clientId, message) {
    let msgString = JSON.stringify(message);
    this.callbacks.onReceive(clientId, msgString);
  }

  pushClientString(clientId, msgString) {
    this.callbacks.onReceive(clientId, msgString);
  }

  onAttach(callback) { this.callbacks.onAttach = callback; }
  onDetach(callback) { this.callbacks.onDetach = callback; }
  onReceive(callback) { this.callbacks.onReceive = callback; }
}
