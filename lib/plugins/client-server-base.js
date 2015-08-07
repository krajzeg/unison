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

export function serializeArguments(args) {
  return _.map(args, (arg) => {
    if (arg && arg.u && arg._path) {
      return {_u: arg.path()};
    } else {
      return arg;
    }
  });
}

export function deserializeArguments(u, args) {
  return _.map(args, (arg) => {
    if (isObject(arg) && (arg._u !== undefined)) {
      return u(arg._u);
    } else {
      return arg;
    }
  });
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
    callback(message);
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
