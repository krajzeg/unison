'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 


relations;function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}var _util = require('../util');var _ = require('lodash');function relations() {
  return (0, _util.functionized)(RelationsPlugin, [], 'applyPlugin');}


function RelationsPlugin() {
  // nothing to initialize
}
RelationsPlugin.prototype = { 
  applyPlugin: function applyPlugin(u) {
    this.u = u;

    // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
    var fallbackMethods = {};
    if (u.serverSide || u.clientSide) {
      u.define({ 
        commands: { 
          now: relateWith, 
          noLonger: ceaseRelationWith } });} else 


    {
      fallbackMethods = { 
        now: relateWith, 
        noLonger: ceaseRelationWith };}



    // add the global 'destroying' listener so relations are cleaned up before object destruction
    u.listen('**', 'destroying', relationPluginOnDestroyListener);

    // done!
    return { 
      nodeMethods: fallbackMethods, 
      onDefine: this.processDefinitions.bind(this) };}, 



  processDefinitions: function processDefinitions(typeName, defs, prototype) {
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
      aRels[rel.AtoB] = rel;bRels[rel.BtoA] = inverseRel;});} };




function findRelation(node, relationName) {
  var type = node.type();
  while (type) {
    if (type.relations && type.relations[relationName]) 
    return type.relations[relationName];
    type = type.extend;}


  throw new Error(node.type().name + ' objects cannot enter into relations named \'' + relationName + '\'.');}


function relateWith(name, otherSide) {
  var rel = findRelation(this, name);

  var isSingularRelation = !!rel.B;
  addRelation(this, name, otherSide, isSingularRelation);
  var inverse = rel.BtoA, isInverseSingular = rel.A;
  addRelation(otherSide, inverse, this, isInverseSingular);}


function ceaseRelationWith(name, otherSide) {
  var rel = findRelation(this, name);

  removeRelation(this, name, otherSide);
  removeRelation(otherSide, rel.BtoA, this);}


function addRelation(fromObj, name, toObj) {var removePreviousRelations = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
  var u = fromObj.u, toPath = toObj.path(), propName = prop(name);

  var fromType = fromObj.type(), toType = toObj.type();
  var rel = findRelation(fromObj, name);
  if (!toObj.isA(rel.withType)) 
  throw new Error(fromType.name + ' objects enter \'' + name + '\' relations only with ' + rel.withType + ' objects.');

  var currentRels = fromObj.get[propName] || [];
  if (_.contains(currentRels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' already exists.');

  if (removePreviousRelations && currentRels.length) {(function () {
      var inverse = rel.BtoA;
      _.each(currentRels, function (path) {
        removeRelation(u(path), inverse, fromObj);});

      currentRels = [];})();}


  var updatedRels = currentRels.concat([toObj.path()]);

  fromObj.update(_defineProperty({}, propName, updatedRels));
  fromObj.trigger('now:' + name, { target: toObj });}


function removeRelation(fromObj, name, toObj) {
  var toPath = toObj.path(), propName = prop(name);

  var rels = fromObj.get[propName] || [];
  if (!_.contains(rels, toPath)) 
  throw new Error('Relation \'' + fromObj.path() + ' ' + name + ' ' + toPath + '\' can\'t be removed because it doesn\'t exist.');

  fromObj.update(_defineProperty({}, propName, _.without(rels, toPath)));
  fromObj.trigger('noLonger:' + name, { target: toObj });}



function makeCheckFn(relationName) {
  return function (otherSide) {
    var path = otherSide.path();
    var rels = this.get[prop(relationName)] || [];
    return rels.indexOf(path) >= 0;};}



function makeSingleGetter(relationName) {
  return function () {
    var rels = this.get[prop(relationName)];
    var time = this.timestamp();
    if (rels && rels.length > 0) 
    return this.u(_.first(rels), time);else 

    return undefined;};}



function makeMultipleGetter(relationName) {
  return function () {var _this = this;
    var propName = prop(relationName);
    var rels = this.get[propName] || [];
    var time = this.timestamp();
    return _.map(rels, function (path) {return _this.u(path, time);});};}



function prop(relationName) {
  return "rel_" + relationName;}


function relationPluginOnDestroyListener(evt) {
  // this runs whenever an object is destroyed and ensures that all relations this object had
  // are severed
  var object = evt.source, u = object.u;
  _.keys(object.get || {}).forEach(function (propertyName) {
    if (/^rel_.*/.test(propertyName)) {(function () {
        // this is a relation, we should sever all instances of it
        var relatedPaths = object.get[propertyName], 
        relation = propertyName.substring(4);
        relatedPaths.forEach(function (path) {return object.noLonger(relation, u(path));});})();}});}module.exports = exports['default'];
//# sourceMappingURL=../plugins/relations.js.map