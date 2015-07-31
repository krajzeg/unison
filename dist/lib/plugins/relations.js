'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 

relations;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');function relations(rels) {
  var plugin = new Relations(rels);
  return function (u) {return plugin.applyPlugin(u);};}var 


Relations = (function () {
  function Relations(relations) {var _this = this;_classCallCheck(this, Relations);
    this.relations = {};

    _.each(relations, function (rel) {
      _this.relations[rel.AtoB] = rel;
      _this.relations[rel.BtoA] = rel;});}_createClass(Relations, [{ key: 'find', value: 



    function find(name) {
      return this.relations[name];} }, { key: 'applyPlugin', value: 


    function applyPlugin(u) {
      this.u = u;

      // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
      var nodeMethods = {}, addCommand = undefined;

      if (u.addCommand) {
        addCommand = u.addCommand.bind(u);} else 
      {
        addCommand = function (name, fn) {nodeMethods[name] = fn;};}

      addCommand('relate', makeRelateFn(this));
      //addCommand('cease', makeCeaseFn(this));

      // add all .contains(x)-type predicates and .now/noLonger.contains-type methods
      var relationNames = _.keys(this.relations);
      var checkMethods = _.object(_.map(relationNames, function (name) {return [name, makeCheckFn(name)];}));
      var nowMethods = _.object(_.map(relationNames, function (name) {return [name, makeNowFn(name)];}));

      // done!
      return { 
        nodeMethods: _.extend(nodeMethods, checkMethods, { now: nowMethods }) };} }]);return Relations;})();




function makeRelateFn(relations) {
  return function (name, otherSide) {
    var relation = relations.find(name);
    if (!relation) 
    throw new Error('Unknown relation name: \'$relation\'');

    var inverseName = relation.AtoB == name ? relation.BtoA : relation.AtoB;

    addRelation(this, name, otherSide);
    addRelation(otherSide, inverseName, this);};}



function makeNowFn(relationName) {
  return function (other) {
    return this.relate(relationName, other);};}



function makeCheckFn(relationName) {
  return function (otherSide) {
    var path = otherSide.path();
    var rels = this.get[relationName] || [];
    return rels.indexOf(path) >= 0;};}



function addRelation(fromObj, name, toObj) {
  var toPath = toObj.path();

  var currentRels = fromObj.get[name] || [];
  if (currentRels.indexOf(toPath) >= 0) 
  throw new Error(fromObj.path() + ' already ' + name + ' ' + toPath);

  var updatedRels = currentRels.concat([toObj.path()]);
  fromObj.update(_defineProperty({}, name, updatedRels));}module.exports = exports['default'];
//# sourceMappingURL=../plugins/relations.js.map