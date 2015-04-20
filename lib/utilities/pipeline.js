'use strict';

var Promise = require('rsvp').Promise;

function Pipeline(hookNames) {
  hookNames = hookNames || [];

  this._pipelineHooks = hookNames.reduce(function(pipelineHooks, hookName) {
    pipelineHooks[hookName] = [];

    return pipelineHooks;
  }, {});

}

Pipeline.prototype.register = function(hookName, fn) {
  var pipelineHooks = this._pipelineHooks;

  if (pipelineHooks[hookName]) {
    pipelineHooks[hookName].push(fn);
  }
};

Pipeline.prototype.run = function(context) {
  context = context || {};

  var pipelineHooks = this._pipelineHooks;
  var hookNames     = Object.keys(pipelineHooks);

  return hookNames.reduce(function(promise, hookName) {
    var hookPromise = this._executeHook.bind(this, hookName, context);
    return promise.then(hookPromise);
  }.bind(this), Promise.resolve());
};

Pipeline.prototype._executeHook = function(hookName, context) {
  var hookFunctions = this._pipelineHooks[hookName];

  return hookFunctions.reduce(function(promise, fn) {
    return promise.then(function() {
      return fn(context);
    });
  }, Promise.resolve());
},

module.exports = Pipeline;
