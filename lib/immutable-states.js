let _ = require('lodash');

import { isObject, parentPath, idFromPath } from './util';

export function stateWithUpdate(state, path, changedProperties, deletedProperties = undefined) {
  let currentObject = path ? _.get(state, path) : state;
  if (!isObject(currentObject))
    throw new Error(`Cannot apply update at '${path}': the thing under this path is not an object.`);

  let changedObject = _.extend(Object.create(Object.getPrototypeOf(currentObject)), currentObject, changedProperties);
  if (deletedProperties)
    deletedProperties.forEach((prop) => { delete changedObject[prop]; });

  if (path != '') {
    let changedObjectId = idFromPath(path), parent = parentPath(path);
    return stateWithUpdate(state, parent, {[changedObjectId]: changedObject});
  } else {
    return changedObject;
  }
}

export function stateWithDelete(state, path) {
  let parent = parentPath(path), id = idFromPath(path);
  return stateWithUpdate(state, parent, {}, [id]);
}
