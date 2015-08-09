'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports.



stateWithUpdate = stateWithUpdate;exports.
















stateWithDelete = stateWithDelete;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _util = require('./util');var _ = require('lodash');function stateWithUpdate(_x2, _x3, _x4) {var _arguments = arguments;var _again = true;_function: while (_again) {var state = _x2, path = _x3, changedProperties = _x4;deletedProperties = currentObject = changedObject = changedObjectId = _parent = undefined;_again = false;var deletedProperties = _arguments.length <= 3 || _arguments[3] === undefined ? undefined : _arguments[3];var currentObject = path ? _.get(state, path) : state;if (!(0, _util.isObject)(currentObject)) throw new Error('Cannot apply update at \'' + path + '\': the thing under this path is not an object.');var changedObject = _.extend({}, currentObject, changedProperties);if (deletedProperties) deletedProperties.forEach(function (prop) {delete changedObject[prop];});if (path != '') {var changedObjectId = (0, _util.idFromPath)(path), _parent = (0, _util.parentPath)(path);_arguments = [_x2 = state, _x3 = _parent, _x4 = _defineProperty({}, changedObjectId, changedObject)];_again = true;continue _function;} else {return changedObject;}}}function stateWithDelete(state, path) {
  var parent = (0, _util.parentPath)(path), id = (0, _util.idFromPath)(path);
  return stateWithUpdate(state, parent, {}, [id]);}
//# sourceMappingURL=immutable-states.js.map