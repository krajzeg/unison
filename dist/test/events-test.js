'use strict';var assert = require('chai').assert;
var sinon = require('sinon');
var unison = require('../lib');

describe('Update listeners', function () {
  var $$ = undefined;
  beforeEach(function () {
    $$ = unison.local({ 
      bird: { name: 'eagle' } });});



  it('should be triggered once after each update', function () {
    var callback = sinon.spy();

    $$('bird').on('updated', callback);
    $$('bird').update({ wingspan: 12 });
    $$('bird').update({ soaring: 'high' });

    assert.ok(callback.calledTwice);});});
//# sourceMappingURL=events-test.js.map