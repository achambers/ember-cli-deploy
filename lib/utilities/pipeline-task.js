var Task        = require('ember-cli/lib/models/task');
var RSVP        = require('rsvp');
var SilentError = require('ember-cli/lib/errors/silent');

module.exports = Task.extend({
  init: function() {
    if (!this.config) {
      throw new SilentError('No configuration passed to pipeline task');
    }

    var addons = this.config.project.addons;
    addons.forEach(this._mergePluginsDeploymentsHooks.bind(this));
  },

  deploymentHooks: {
    willDeploy: [],
    build: [],
    upload: [],
    activate: [],
    didDeploy: []
  },

  run: function(hookNames, context) {
    hookNames = hookNames || Object.keys(this.deploymentHooks);

    return hookNames.reduce(function(promise, hookName) {
      return promise.then(this.executeDeploymentHook.bind(this, hookName, context));
    }.bind(this), RSVP.resolve());
  },

  executeDeploymentHook: function(hookName, context) {
    var promises = this.deploymentHooks[hookName].map(function(hook) {
      return RSVP.resolve(hook.bind(this)(context));
    }.bind(this));

    return RSVP.all(promises);
  },

  _mergePluginsDeploymentsHooks: function(addon) {
    var keywords = addon.pkg.keywords;
    if (keywords.indexOf('ember-cli-deploy-plugin') > -1) {
      var name = addon.name.match(/^(ember\-cli\-deploy\-)(.*)$/)[2];
      var hooks = addon.createDeployPlugin({name: name});

      Object.keys(this.deploymentHooks).forEach(function(hookName) {
        var hookFunction = hooks[hookName];

        if (hookFunction) {
          this.deploymentHooks[hookName].push(hookFunction);
        }
      }.bind(this));
    }
  }
});
