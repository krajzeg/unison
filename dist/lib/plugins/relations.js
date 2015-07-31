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
      var rel = this.relations[name];
      if (!rel) 
      throw new Error('Unknown relation name: \'$rel\'');
      return rel;} }, { key: 'findInverse', value: 


    function findInverse(name) {
      var rel = this.find(name);
      return rel.AtoB == name ? rel.BtoA : rel.AtoB;} }, { key: 'applyPlugin', value: 


    function applyPlugin(u) {
      this.u = u;

      // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
      var nodeMethods = {}, addCommand = undefined;

      if (u.addCommand) {
        addCommand = u.addCommand.bind(u);} else 
      {
        addCommand = function (name, fn) {nodeMethods[name] = fn;};}

      addCommand('now', makeRelateFn(this));
      addCommand('noLonger', makeCeaseFn(this));

      // add all .contains(x)-type predicates and .now/noLonger.contains-type methods
      var relationNames = _.keys(this.relations);
      var checkMethods = _.object(_.map(relationNames, function (name) {return [name, makeCheckFn(name)];}));

      // done!
      return { 
        nodeMethods: _.extend(nodeMethods, checkMethods) };} }]);return Relations;})();




function makeRelateFn(relations) {
  return function (name, otherSide) {
    addRelation(this, name, otherSide);
    addRelation(otherSide, relations.findInverse(name), this);};}



function makeCeaseFn(relations) {
  return function (name, otherSide) {
    removeRelation(this, name, otherSide);
    removeRelation(otherSide, relations.findInverse(name), this);};}



function makeCheckFn(relationName) {
  return function (otherSide) {
    var path = otherSide.path();
    var rels = this.get[relationName] || [];
    return rels.indexOf(path) >= 0;};}



function addRelation(fromObj, name, toObj) {
  var toPath = toObj.path();

  var currentRels = fromObj.get[name] || [];
  if (_.contains(currentRels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' already exists.');

  var updatedRels = currentRels.concat([toObj.path()]);
  fromObj.update(_defineProperty({}, name, updatedRels));}


function removeRelation(fromObj, name, toObj) {
  var toPath = toObj.path();

  var rels = fromObj.get[name] || [];
  if (!_(rels).contains(toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' can\'t be removed, because it doesn\'t exist.');

  fromObj.update(_defineProperty({}, name, _(rels).without(toPath)));}module.exports = exports['default'];
//# sourceMappingURL=../plugins/relations.js.map