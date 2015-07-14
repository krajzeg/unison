var assert = require('chai').assert;

describe("ES6", () => {
	it("should be compiled properly", () => {
		assert.deepEqual(require('../lib'), [2,4,6]);
	});
});