export const COMMAND = 'c', INTENT = 'i';

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
  if (message.length != 4) return false;

  let [code] = message;
  if (code != COMMAND && code != INTENT)
    return false;

  return true;
}
