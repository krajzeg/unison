export default class UserError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.reportToUser = true;
  }
}
