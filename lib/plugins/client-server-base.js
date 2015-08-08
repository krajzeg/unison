let _ = require('lodash');
import { isObject } from '../util';

export const COMMAND = 'c', INTENT = 'i', RESPONSE = 'r';
export const RESPONSE_OK = 'ok', RESPONSE_ERROR = 'err';

const ACCEPTABLE_MESSAGE_TYPES = [COMMAND, INTENT, RESPONSE];
const ACCEPTABLE_MESSAGE_LENGTHS = {
  [COMMAND]: 4,
  [INTENT]: 5,
  [RESPONSE]: 4
};

export const BUILTIN_COMMANDS = {
  _seed(state) {
    // we have to do this through .update() and .add() to trigger events properly
    let children = _.pick(state, isObject);
    let props = _.pick(state, _.negate(isObject));

    // set all properties
    this.update(props);

    // add all children
    _.each(children, (child, id) => {
      this.add(id, child);
    });
  }
};

export function serializeAll(args) {
  return args.map((arg) => serialize(arg));
}

export function deserializeAll(u, args) {
  return args.map((arg) => deserialize(u, arg));
}

export function serialize(obj) {
  if (obj && obj.u && obj._path) {
    return {_u: obj.path()};
  } else {
    return obj;
  }
}

export function deserialize(u, obj) {
  if (obj && isObject(obj) && (obj._u !== undefined)) {
    return u(obj._u);
  } else {
    return obj;
  }
}

export function parseMessage(msgString, callback) {
  // parse the message
  let message;
  try {
    message = JSON.parse(msgString);
    let valid = messageValid(message);
    if (!valid)
      throw new Error('Incorrect message format.');
  } catch(e) {
    console.error(`Received garbage message: '${msgString}'.`);
    console.error(e);
    return;
  }

  // try to act upon it
  try {
    return callback(message);
  } catch(e) {
    console.error(`Problem encountered when handling message '${msgString}':`);
    console.error(e.stack || e);
  }
}

function messageValid(message) {
  if (!(message instanceof Array)) return false;

  let type = message[0];
  if (ACCEPTABLE_MESSAGE_TYPES.indexOf(type) < 0) return false;
  if (message.length != ACCEPTABLE_MESSAGE_LENGTHS[type]) return false;

  return true;
}
