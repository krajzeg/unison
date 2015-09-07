let _ = require('lodash');
import { functionized } from '../util';

export default function relations() {
  return functionized(RelationsPlugin, [], 'applyPlugin');
}

function RelationsPlugin() {
  // nothing to initialize
}
RelationsPlugin.prototype = {
  applyPlugin(u) {
    this.u = u;

    // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
    let fallbackMethods = {};
    if (u.serverSide || u.clientSide) {
      u.define({
        commands: {
          now: relateWith,
          noLonger: ceaseRelationWith
        }
      });
    } else {
      fallbackMethods = {
        now: relateWith,
        noLonger: ceaseRelationWith
      }
    }

    // add the global 'destroying' listener so relations are cleaned up before object destruction
    u.listen('**', 'destroying', relationPluginOnDestroyListener);

    // done!
    return {
      nodeMethods: fallbackMethods,
      onDefine: this.processDefinitions.bind(this)
    };
  },

  processDefinitions(typeName, defs, prototype) {
    let u = this.u, rels = defs.relations || {};

    _.each(rels, (rel) => {
      rel.withType = rel.withType || 'Node';
      let aType = u.type(typeName), bType = u.type(rel.withType);
      let aProto = prototype, bProto = bType.proto;

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

      let aRels = aType.relations, bRels = bType.relations || {};
      let inverseRel = {withType: typeName, AtoB: rel.BtoA, BtoA: rel.AtoB, A: rel.B, B: rel.A, As: rel.Bs, Bs: rel.As};
      aRels[rel.AtoB] = rel; bRels[rel.BtoA] = inverseRel;
    });
  }
};

function findRelation(node, relationName) {
  let type = node.type();
  while (type) {
    if (type.relations && type.relations[relationName])
      return type.relations[relationName];
    type = type.extend;
  }

  throw new Error(`${node.type().name} objects cannot enter into relations named '${relationName}'.`);
}

function relateWith(name, otherSide) {
  let rel = findRelation(this, name);

  let isSingularRelation = !!rel.B;
  addRelation(this, name, otherSide, isSingularRelation);
  let inverse = rel.BtoA, isInverseSingular = rel.A;
  addRelation(otherSide, inverse, this, isInverseSingular);
}

function ceaseRelationWith(name, otherSide) {
  let rel = findRelation(this, name);

  removeRelation(this, name, otherSide);
  removeRelation(otherSide, rel.BtoA, this);
}

function addRelation(fromObj, name, toObj, removePreviousRelations = false) {
  let u = fromObj.u, toPath = toObj.path(), propName = prop(name);

  let fromType = fromObj.type(), toType = toObj.type();
  let rel = findRelation(fromObj, name);
  if (!toObj.isA(rel.withType))
    throw new Error(`${fromType.name} objects enter '${name}' relations only with ${rel.withType} objects.`);

  let currentRels = fromObj.get[propName] || [];
  if (_.contains(currentRels, toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' already exists.`);

  if (removePreviousRelations && currentRels.length) {
    let inverse = rel.BtoA;
    _.each(currentRels, (path) => {
      removeRelation(u(path), inverse, fromObj);
    });
    currentRels = [];
  }

  let updatedRels = currentRels.concat([toObj.path()]);

  fromObj.update({[propName]: updatedRels});
  fromObj.trigger('now:' + name, {target: toObj});
}

function removeRelation(fromObj, name, toObj) {
  let toPath = toObj.path(), propName = prop(name);

  let rels = fromObj.get[propName] || [];
  if (!_.contains(rels, toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' can't be removed because it doesn't exist.`);

  fromObj.update({[propName]: _.without(rels, toPath)});
  fromObj.trigger('noLonger:' + name, {target: toObj});
}


function makeCheckFn(relationName) {
  return function(otherSide) {
    let path = otherSide.path();
    let rels = this.get[prop(relationName)] || [];
    return rels.indexOf(path) >= 0;
  }
}

function makeSingleGetter(relationName) {
  return function() {
    let rels = this.get[prop(relationName)];
    let time = this.timestamp();
    if (rels && rels.length > 0)
      return this.u(_.first(rels), time);
    else
      return undefined;
  }
}

function makeMultipleGetter(relationName) {
  return function() {
    let propName = prop(relationName)
    let rels = this.get[propName] || [];
    let time = this.timestamp();
    return _.map(rels, (path) => this.u(path, time));
  }
}

function prop(relationName) {
  return "rel_" + relationName;
}

function relationPluginOnDestroyListener(evt) {
  // this runs whenever an object is destroyed and ensures that all relations this object had
  // are severed
  let object = evt.source, u = object.u;
  _.keys(object.get || {}).forEach((propertyName) => {
    if (/^rel_.*/.test(propertyName)) {
      // this is a relation, we should sever all instances of it
      let relatedPaths = object.get[propertyName],
        relation = propertyName.substring(4);
      relatedPaths.forEach((path) => object.noLonger(relation, u(path)));
    }
  });
}
