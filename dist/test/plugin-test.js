'use strict';var assert = require('chai').assert;
var unison = require('../lib');

describe('Plugins', function () {
  it('should be able to add methods to the core Unison object', function () {
    var $$ = unison({});

    $$.plugin(function () {
      return { 
        methods: { 
          greeting: function greeting() {return 'Hello!';} } };});




    assert.equal($$.greeting(), 'Hello!');});


  it('should be able to add methods to nodes', function () {
    var $$ = unison({ 'apple': {} });
    $$.plugin(function () {
      return { 
        nodeMethods: { 
          uppercasePath: function uppercasePath() {return this.path().toUpperCase();} } };});




    assert.equal($$('apple').uppercasePath(), 'APPLE');});


  it('should be able to affect the Unison object directly if really needed', function () {
    var $$ = unison({});

    $$.plugin(function (unison) {
      unison.iWasThere = true;});


    assert.equal($$.iWasThere, true);});});
//# sourceMappingURL=plugin-test.js.map