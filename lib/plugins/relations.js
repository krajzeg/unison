let _ = require('lodash');

export default function relations(rels) {
  let plugin = new Relations(rels)
  return (u) => (plugin.applyPlugin(u));
}

class Relations {
  constructor(relations) {
    this.relations = relations;
  }

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

  applyPlugin(u) {
    this.u = u;

    // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
    let fallbackMethods = {};
    if (u.serverSide || u.clientSide) {
      u.define({
        commands: {
          now: makeRelateFn(this),
          noLonger: makeCeaseFn(this)
        }
      });
    } else {
      fallbackMethods = {
        now: makeRelateFn(this),
        noLonger: makeCeaseFn(this)
      }
    }

    // apply definitions
    u.define({relations: this.relations});

    // done!
    return {
      nodeMethods: _.extend(fallbackMethods),
      onDefine: this.processDefinitions.bind(this)
    };
  }
}

function makeRelateFn(relations) {
  return function(name, otherSide) {
    let rel = this.type().relations[name];
    if (!rel)
      throw new Error(`${this.type().name} objects cannot enter into relations named '${name}'.`);

    let isSingularRelation = !!rel.B;
    addRelation(this, name, otherSide, isSingularRelation);
    let inverse = rel.BtoA, isInverseSingular = rel.A;
    addRelation(otherSide, inverse, this, isInverseSingular);
  };
}

function makeCeaseFn(relations) {
  return function(name, otherSide) {
    let rel = this.type().relations[name];
    if (!rel)
      throw new Error(`${this.type().name} objects cannot enter into relations named '${name}'.`);

    removeRelation(this, name, otherSide);
    removeRelation(otherSide, rel.BtoA, this);
  }
}

function makeCheckFn(relationName) {
  return function(otherSide) {
    let path = otherSide.path();
    let rels = this.get[relationName] || [];
    return rels.indexOf(path) >= 0;
  }
}

function makeSingleGetter(relationName) {
  return function() {
    let rels = this.get[relationName];
    let time = this.timestamp();
    if (rels && rels.length > 0)
      return this.u(_.first(rels), time);
    else
      return undefined;
  }
}

function makeMultipleGetter(relationName) {
  return function() {
    let rels = this.get[relationName] || [];
    let time = this.timestamp();
    return _.map(rels, (path) => this.u(path, time));
  }
}

function addRelation(fromObj, name, toObj, removePreviousRelations = false) {
  let u = fromObj.u, toPath = toObj.path();

  let fromType = fromObj.type(), toType = toObj.type();
  let rel = fromType.relations[name];
  if (!rel)
    throw new Error(`Object of type '${fromType.name}' cannot enter relations named '${name}'.`);
  if (rel.withType != toType.name)
    throw new Error(`${fromType.name} objects enter '${name}' relations only with ${rel.withType} objects.`);

  let currentRels = fromObj.get[name] || [];
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

  fromObj.update({[name]: updatedRels});
  fromObj.trigger('now:' + name, {target: toObj});
}

function removeRelation(fromObj, name, toObj) {
  let toPath = toObj.path();

  let rels = fromObj.get[name] || [];
  if (!_.contains(rels, toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' can't be removed because it doesn't exist.`);

  fromObj.update({[name]: _.without(rels, toPath)});
  fromObj.trigger('noLonger:' + name, {target: toObj});
}
