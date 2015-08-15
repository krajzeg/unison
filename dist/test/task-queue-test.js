'use strict';var _libTaskQueues = require(

'../lib/task-queues');var assert = require('chai').assert;var Promise = require('bluebird');

describe("Task queues", function () {
  it("should execute synchronous tasks synchronously", function () {
    var q = new _libTaskQueues.Queue();

    var a = 0;
    q.schedule(function () {a += 1;});
    q.schedule(function () {a *= 2;});
    q.schedule(function () {a += 3;});
    q.schedule(function () {a *= 5;});

    assert.equal(a, 25);});


  it("should execute asynchronous tasks one at a time in order", function (done) {
    var q = new _libTaskQueues.Queue();

    var a = 0;
    q.schedule(function () {return (
        wait(10).then(function () {a += 1;}));});

    q.schedule(function () {return (
        wait(10).then(function () {a *= 2;}));});

    q.schedule(function () {return (
        wait(10).then(function () {a += 3;}));});

    q.schedule(function () {return (
        wait(10).then(function () {a *= 5;}));});


    q.waitUntilEmpty().then(function () {
      assert.equal(a, 25);}).
    then(done)['catch'](done);});


  it("should create automatically queued functions with synchronize", function (done) {
    var q = new _libTaskQueues.Queue();

    var a = 0;
    var multiply = q.synchronize(function (x) {return (
        wait(10).then(function () {a *= x;}));});

    var add = q.synchronize(function (x) {return (
        wait(10).then(function () {a += x;}));});


    add(2);
    multiply(3);
    add(5);
    multiply(7);

    q.waitUntilEmpty().then(function () {
      assert.equal(a, 77);}).
    then(done)['catch'](done);});});



function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);});}
//# sourceMappingURL=task-queue-test.js.map