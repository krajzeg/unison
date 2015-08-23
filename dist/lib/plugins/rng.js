'use strict';Object.defineProperty(exports, '__esModule', { value: true });exports['default'] = 




rng;function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { 'default': obj };}var _lodash = require('lodash');var _lodash2 = _interopRequireDefault(_lodash);var _rng = require('rng');var _rng2 = _interopRequireDefault(_rng);var _util = require('../util');function rng(_ref) {var version = _ref.version;var seed = _ref.seed;
  if (version == 'client') {
    return (0, _util.functionized)(ClientRNGPlugin, [], 'applyPlugin');} else 
  if (version == 'server') {
    return (0, _util.functionized)(ServerRNGPlugin, [seed], 'applyPlugin');} else 
  {
    throw new Error("Initialize RNG plugin either as rng({version: 'server'}) or rng({version: 'client'}).");}}



var CommonRNG = { 
  applyPlugin: function applyPlugin(u) {
    return { 
      name: 'rng', 
      methods: { 
        rng: { 
          u: u, 
          int: this.randomInt, 
          pick: this.randomPick } } };}, 





  randomPick: function randomPick(collection) {
    return collection(this.randomInt(0, collection.length));} };



function ServerRNGPlugin(seed) {
  if (seed === undefined) seed = process.hrtime()[1]; // obviously, we'll want a better seed at some point
  this.generator = new _rng2['default'].MT(seed);}

ServerRNGPlugin.prototype = _lodash2['default'].extend(Object.create(CommonRNG), { 
  randomInt: function randomInt(low, high) {
    var u = this.u, result = low + Math.floor(u.plugins.rng.generator.uniform() * (high - low));

    // store this result in command extras to be replicated on the client
    var extras = u.plugins.server.getCommandExtras();
    if (extras.rng) {
      extras.rng.push(result);} else 
    {
      extras.rng = [result];}


    // give the result back
    return result;} });



function ClientRNGPlugin() {}

ClientRNGPlugin.prototype = _lodash2['default'].extend(Object.create(CommonRNG), { 
  randomInt: function randomInt(low, high) {
    var u = this.u;

    // get the results from the server
    var results = u.plugins.client.getCommandExtras().rng;
    if (!results || !results.length) 
    throw new Error("Something went wrong with the RNG - no server results available.");

    // is it kosher?
    var result = results.shift();
    if (result < low || result >= high) 
    throw new Error("Something went wrong with the RNG - server-reported results don't match the expected range.");

    // yup
    return result;} });module.exports = exports['default'];
//# sourceMappingURL=../plugins/rng.js.map