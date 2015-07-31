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
    return this.relations[name];
  }

  applyPlugin(u) {
    this.u = u;

    // add the core 'relate' and 'cease' commands (or methods if not in a client/server environment)
    let nodeMethods = {}, addCommand;

    if (u.addCommand) {
      addCommand = u.addCommand.bind(u);
    } else {
      addCommand = function(name, fn) { nodeMethods[name] = fn; };
    }
    addCommand('relate', makeRelateFn(this));
    //addCommand('cease', makeCeaseFn(this));

    // add all .contains(x)-type predicates and .now/noLonger.contains-type methods
    let relationNames = _.keys(this.relations);
    let checkMethods = _.object(_.map(relationNames, (name) => [name, makeCheckFn(name)]));
    let nowMethods = _.object(_.map(relationNames, (name) => [name, makeNowFn(name)]));

    // done!
    return {
      nodeMethods: _.extend(nodeMethods, checkMethods, {now: nowMethods})
    };
  }
}

function makeRelateFn(relations) {
  return function(name, otherSide) {
    let relation = relations.find(name);
    if (!relation)
      throw new Error(`Unknown relation name: '$relation'`);

    let inverseName = (relation.AtoB == name) ? relation.BtoA : relation.AtoB;

    addRelation(this, name, otherSide);
    addRelation(otherSide, inverseName, this);
  };
}

function makeNowFn(relationName) {
  return function(other) {
    return this.relate(relationName, other);
  }
}

function makeCheckFn(relationName) {
  return function(otherSide) {
    let path = otherSide.path();
    let rels = this.get[relationName] || [];
    return rels.indexOf(path) >= 0;
  }
}

function addRelation(fromObj, name, toObj) {
  let toPath = toObj.path();

  let currentRels = fromObj.get[name] || [];
  if (currentRels.indexOf(toPath) >= 0)
    throw new Error(`${fromObj.path()} already ${name} ${toPath}`);

  let updatedRels = currentRels.concat([toObj.path()]);
  fromObj.update({[name]: updatedRels});
}
