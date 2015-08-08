let _ = require('lodash');

export default function relations(rels) {
  let plugin = new Relations(rels)
  return (u) => (plugin.applyPlugin(u));
}

class Relations {
  constructor(relations) {
    this.relations = {}

    _.each(relations, (rel) => {
      this.relations[rel.AtoB] = rel;
      this.relations[rel.BtoA] = rel;
    });
  }

  find(name) {
    let rel = this.relations[name];
    if (!rel)
      throw new Error(`Unknown relation name: '$rel'`);
    return rel;
  }

  findInverse(name) {
    let rel = this.find(name);
    return (rel.AtoB == name) ? rel.BtoA : rel.AtoB;
  }

  // Returns 'true' if the object can only be in this relation with one other object (e.g. "is located in")
  isSingular(name) {
    let rel = this.find(name);
    return !!(((rel.AtoB == name) && rel.B) || ((rel.BtoA == name) && rel.A));
  }

  applyPlugin(u) {
    this.u = u;

    // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
    let commands = {}, addCommand;

    if (u.addCommand) {
      addCommand = u.addCommand.bind(u);
    } else {
      addCommand = function(name, fn) { commands[name] = fn; };
    }
    addCommand('now', makeRelateFn(this));
    addCommand('noLonger', makeCeaseFn(this));

    // add all relation predicates
    let relationNames = _.keys(this.relations);
    let predicates = _.object(_.map(relationNames, (name) => [name, makeCheckFn(name)]));

    // add all relation getter methods
    let getters = {};
    _.each(this.relations, (rel) => {
      if (rel.A) getters[rel.A] = makeSingleGetter(rel.BtoA);
      if (rel.B) getters[rel.B] = makeSingleGetter(rel.AtoB);
      if (rel.As) getters[rel.As] = makeMultipleGetter(rel.BtoA);
      if (rel.Bs) getters[rel.Bs] = makeMultipleGetter(rel.AtoB);
    });

    // done!
    return {
      nodeMethods: _.extend(commands, predicates, getters)
    };
  }
}

function makeRelateFn(relations) {
  return function(name, otherSide) {
    addRelation(relations, this, name, otherSide, relations.isSingular(name));

    let inverse = relations.findInverse(name);
    addRelation(relations, otherSide, inverse, this, relations.isSingular(inverse));
  };
}

function makeCeaseFn(relations) {
  return function(name, otherSide) {
    removeRelation(relations, this, name, otherSide);
    removeRelation(relations, otherSide, relations.findInverse(name), this);
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
    if (rels && rels.length > 0)
      return this.u(_.first(rels));
    else
      return undefined;
  }
}

function makeMultipleGetter(relationName) {
  return function() {
    let rels = this.get[relationName] || [];
    return _.map(rels, this.u);
  }
}

function addRelation(relations, fromObj, name, toObj, removePreviousRelations = false) {
  let u = fromObj.u, toPath = toObj.path();

  let currentRels = fromObj.get[name] || [];
  if (_.contains(currentRels, toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' already exists.`);

  if (removePreviousRelations && currentRels.length) {
    let inverse = relations.findInverse(name);
    _.each(currentRels, (path) => {
      removeRelation(relations, u(path), inverse, fromObj);
    });
    currentRels = [];
  }

  let updatedRels = currentRels.concat([toObj.path()]);

  fromObj.update({[name]: updatedRels});
  fromObj.trigger('now:' + name, {target: toObj});
}

function removeRelation(relations, fromObj, name, toObj) {
  let toPath = toObj.path();

  let rels = fromObj.get[name] || [];
  if (!_.contains(rels, toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' can't be removed, because it doesn't exist.`);

  fromObj.update({[name]: _.without(rels, toPath)});
  fromObj.trigger('noLonger:' + name, {target: toObj});
}
