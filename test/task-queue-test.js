let assert = require('chai').assert;
import { Queue } from '../lib/task-queues'

describe("Task queues", () => {
  it("should execute synchronous tasks synchronously", () => {
    let q = new Queue();

    let a = 0;
    q.schedule(() => { a += 1; });
    q.schedule(() => { a *= 2; });
    q.schedule(() => { a += 3; });
    q.schedule(() => { a *= 5; });

    assert.equal(a, 25);
  });

  it("should execute asynchronous tasks one at a time in order", (done) => {
    let q = new Queue();

    let a = 0;
    q.schedule(() =>
      wait(10).then(() => { a += 1; })
    );
    q.schedule(() =>
      wait(10).then(() => { a *= 2; })
    );
    q.schedule(() =>
      wait(10).then(() => { a += 3; })
    );
    q.schedule(() =>
      wait(10).then(() => { a *= 5; })
    );

    q.waitUntilEmpty().then(() => {
      assert.equal(a, 25);
    }).then(done).catch(done);
  });

  it("should create automatically queued functions with synchronize", (done) => {
    let q = new Queue();

    let a = 0;
    let multiply = q.synchronize((x) =>
      wait(10).then(() => { a *= x; })
    );
    let add = q.synchronize((x) =>
      wait(10).then(() => { a += x; })
    );

    add(2);
    multiply(3);
    add(5);
    multiply(7);

    q.waitUntilEmpty().then(() => {
      assert.equal(a, 77);
    }).then(done).catch(done);
  });
});

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

