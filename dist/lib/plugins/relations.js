'use strict';Object.defineProperty(exports, '__esModule', { value: true });var _createClass = (function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};})();exports['default'] = 

relations;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError('Cannot call a class as a function');}}var _ = require('lodash');function relations(rels) {
  var plugin = new Relations(rels);
  return function (u) {return plugin.applyPlugin(u);};}var 


Relations = (function () {
  function Relations(relations) {_classCallCheck(this, Relations);
    this.relations = relations;}_createClass(Relations, [{ key: 'processDefinitions', value: 


    function processDefinitions(typeName, defs, prototype) {
      var u = this.u, rels = defs.relations || {};

      _.each(rels, function (rel) {
        rel.withType = rel.withType || 'Node';
        var aType = u.type(typeName), bType = u.type(rel.withType);
        var aProto = prototype, bProto = bType.proto;

        // add predicates
        aProto[rel.AtoB] = makeCheckFn(rel.AtoB);
        bProto[rel.BtoA] = makeCheckFn(rel.BtoA);

        // add getters
        if (rel.B) aProto[rel.B] = makeSingleGetter(rel.AtoB);
        if (rel.Bs) aProto[rel.Bs] = makeMultipleGetter(rel.AtoB);
        if (rel.A) bProto[rel.A] = makeSingleGetter(rel.BtoA);
        if (rel.As) bProto[rel.As] = makeMultipleGetter(rel.BtoA);

        // register relations for easy lookup
        if (!aType.relations) aType.relations = {};
        if (!bType.relations) bType.relations = {};

        var aRels = aType.relations, bRels = bType.relations || {};
        var inverseRel = { withType: typeName, AtoB: rel.BtoA, BtoA: rel.AtoB, A: rel.B, B: rel.A, As: rel.Bs, Bs: rel.As };
        aRels[rel.AtoB] = rel;bRels[rel.BtoA] = inverseRel;});} }, { key: 'applyPlugin', value: 



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



      // apply definitions
      u.define({ relations: this.relations });

      // done!
      return { 
        nodeMethods: _.extend(fallbackMethods), 
        onDefine: this.processDefinitions.bind(this) };} }]);return Relations;})();




function makeRelateFn(relations) {
  return function (name, otherSide) {
    var rel = this.type().relations[name];
    if (!rel) 
    throw new Error(this.type().name + ' objects cannot enter into relations named \'' + name + '\'.');

    var isSingularRelation = !!rel.B;
    addRelation(this, name, otherSide, isSingularRelation);
    var inverse = rel.BtoA, isInverseSingular = rel.A;
    addRelation(otherSide, inverse, this, isInverseSingular);};}



function makeCeaseFn(relations) {
  return function (name, otherSide) {
    var rel = this.type().relations[name];
    if (!rel) 
    throw new Error(this.type().name + ' objects cannot enter into relations named \'' + name + '\'.');

    removeRelation(this, name, otherSide);
    removeRelation(otherSide, rel.BtoA, this);};}



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
  return function () {var _this = this;
    var rels = this.get[relationName] || [];
    var time = this.timestamp();
    return _.map(rels, function (path) {return _this.u(path, time);});};}



function addRelation(fromObj, name, toObj) {var removePreviousRelations = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
  var u = fromObj.u, toPath = toObj.path();

  var fromType = fromObj.type(), toType = toObj.type();
  var rel = fromType.relations[name];
  if (!rel) 
  throw new Error('Object of type \'' + fromType.name + '\' cannot enter relations named \'' + name + '\'.');
  if (rel.withType != toType.name) 
  throw new Error(fromType.name + ' objects enter \'' + name + '\' relations only with ' + rel.withType + ' objects.');

  var currentRels = fromObj.get[name] || [];
  if (_.contains(currentRels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' already exists.');

  if (removePreviousRelations && currentRels.length) {(function () {
      var inverse = rel.BtoA;
      _.each(currentRels, function (path) {
        removeRelation(u(path), inverse, fromObj);});

      currentRels = [];})();}


  var updatedRels = currentRels.concat([toObj.path()]);

  fromObj.update(_defineProperty({}, name, updatedRels));
  fromObj.trigger('now:' + name, { target: toObj });}


function removeRelation(fromObj, name, toObj) {
  var toPath = toObj.path();

  var rels = fromObj.get[name] || [];
  if (!_.contains(rels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' can\'t be removed because it doesn\'t exist.');

  fromObj.update(_defineProperty({}, name, _.without(rels, toPath)));
  fromObj.trigger('noLonger:' + name, { target: toObj });}module.exports = exports['default'];
//# sourceMappingURL=../plugins/relations.js.map