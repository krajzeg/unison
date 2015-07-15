let assert = require('chai').assert;
let sinon = require('sinon');
let unison = require('../lib');

describe("Update listeners", () => {
  let $$;
  beforeEach(() => {
    $$ = unison.local({
      bird: {name: 'eagle'}
    });
  });

  it("should be triggered once after each update", () => {
    let callback = sinon.spy();

    $$('bird').on('updated', callback);
    $$('bird').update({wingspan: 12});
    $$('bird').update({soaring: 'high'});

    assert.ok(callback.calledTwice);
  });


});