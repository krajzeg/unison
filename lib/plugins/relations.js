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
    addRelation(this, name, otherSide);
    addRelation(otherSide, relations.findInverse(name), this);
  };
}

function makeCeaseFn(relations) {
  return function(name, otherSide) {
    removeRelation(this, name, otherSide);
    removeRelation(otherSide, relations.findInverse(name), this);
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

function addRelation(fromObj, name, toObj) {
  let toPath = toObj.path();

  let currentRels = fromObj.get[name] || [];
  if (_.contains(currentRels, toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' already exists.`);

  let updatedRels = currentRels.concat([toObj.path()]);
  fromObj.update({[name]: updatedRels});
}

function removeRelation(fromObj, name, toObj) {
  let toPath = toObj.path();

  let rels = fromObj.get[name] || [];
  if (!_(rels).contains(toPath))
    throw new Error(`Relation '${fromObj.path()} ${name} ${toPath}' can't be removed, because it doesn't exist.`);

  fromObj.update({[name]: _(rels).without(toPath)});
}