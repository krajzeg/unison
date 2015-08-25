'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 

relations;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');function relations(rels) {
  var plugin = new Relations(rels);
  return function (u) {return plugin.applyPlugin(u);};}var 


Relations = (function () {
  function Relations(relations) {var _this = this;_classCallCheck(this, Relations);
    this.relatives = {};

    _.each(relations, function (rel) {
      _this.relatives[rel.AtoB] = rel;
      _this.relatives[rel.BtoA] = rel;});}_createClass(Relations, [{ key: 'find', value: 



    function find(name) {
      var rel = this.relatives[name];
      if (!rel) 
      throw new Error('Unknown relation name: \'' + name + '\'');
      return rel;} }, { key: 'findInverse', value: 


    function findInverse(name) {
      var rel = this.find(name);
      return rel.AtoB == name ? rel.BtoA : rel.AtoB;}


    // Returns 'true' if the object can only be in this relation with one other object (e.g. "is located in")
  }, { key: 'isSingular', value: function isSingular(name) {
      var rel = this.find(name);
      return !!(rel.AtoB == name && rel.B || rel.BtoA == name && rel.A);} }, { key: 'applyPlugin', value: 


    function applyPlugin(u) {
      this.u = u;

      // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
      var fallbackMethods = {};
      if (u.serverSide || u.clientSide) {
        u.define({ 
          commands: { 
            now: makeRelateFn(this), 
            noLonger: makeCeaseFn(this) } });} else 


      {
        fallbackMethods = { 
          now: makeRelateFn(this), 
          noLonger: makeCeaseFn(this) };}



      // add all relation predicates
      var relationNames = _.keys(this.relatives);
      var predicates = _.object(_.map(relationNames, function (name) {return [name, makeCheckFn(name)];}));

      // add all relation getter methods
      var getters = {};
      _.each(this.relatives, function (rel) {
        if (rel.A) getters[rel.A] = makeSingleGetter(rel.BtoA);
        if (rel.B) getters[rel.B] = makeSingleGetter(rel.AtoB);
        if (rel.As) getters[rel.As] = makeMultipleGetter(rel.BtoA);
        if (rel.Bs) getters[rel.Bs] = makeMultipleGetter(rel.AtoB);});


      // done!
      return { 
        nodeMethods: _.extend(fallbackMethods, predicates, getters) };} }]);return Relations;})();




function makeRelateFn(relations) {
  return function (name, otherSide) {
    addRelation(relations, this, name, otherSide, relations.isSingular(name));

    var inverse = relations.findInverse(name);
    addRelation(relations, otherSide, inverse, this, relations.isSingular(inverse));};}



function makeCeaseFn(relations) {
  return function (name, otherSide) {
    removeRelation(relations, this, name, otherSide);
    removeRelation(relations, otherSide, relations.findInverse(name), this);};}



function makeCheckFn(relationName) {
  return function (otherSide) {
    var path = otherSide.path();
    var rels = this.get[relationName] || [];
    return rels.indexOf(path) >= 0;};}



function makeSingleGetter(relationName) {
  return function () {
    var rels = this.get[relationName];
    var time = this.timestamp();
    if (rels && rels.length > 0) 
    return this.u(_.first(rels), time);else 

    return undefined;};}



function makeMultipleGetter(relationName) {
  return function () {var _this2 = this;
    var rels = this.get[relationName] || [];
    var time = this.timestamp();
    return _.map(rels, function (path) {return _this2.u(path, time);});};}



function addRelation(relations, fromObj, name, toObj) {var removePreviousRelations = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];
  var u = fromObj.u, toPath = toObj.path();

  var currentRels = fromObj.get[name] || [];
  if (_.contains(currentRels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' already exists.');

  if (removePreviousRelations && currentRels.length) {(function () {
      var inverse = relations.findInverse(name);
      _.each(currentRels, function (path) {
        removeRelation(relations, u(path), inverse, fromObj);});

      currentRels = [];})();}


  var updatedRels = currentRels.concat([toObj.path()]);

  fromObj.update(_defineProperty({}, name, updatedRels));
  fromObj.trigger('now:' + name, { target: toObj });}


function removeRelation(relations, fromObj, name, toObj) {
  var toPath = toObj.path();

  var rels = fromObj.get[name] || [];
  if (!_.contains(rels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' can\'t be removed, because it doesn\'t exist.');

  fromObj.update(_defineProperty({}, name, _.without(rels, toPath)));
  fromObj.trigger('noLonger:' + name, { target: toObj });}module.exports = exports['default'];
//# sourceMappingURL=../plugins/relations.js.map