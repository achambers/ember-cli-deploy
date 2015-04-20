var Task        = require('ember-cli/lib/models/task');
var Promise     = require('ember-cli/lib/ext/promise');
var SilentError = require('ember-cli/lib/errors/silent');
var Pipeline    = require('../utilities/pipeline');

module.exports = Task.extend({
  init: function() {
    if (!this.project) {
      throw new SilentError('No project passed to pipeline task');
    }

    if (!this.config) {
      throw new SilentError('No deploy config passed to pipeline task');
    }

    if (!this.appConfig) {
      throw new SilentError('No app config passed to pipeline task');
    }

    if (!this.ui) {
      throw new SilentError('No ui passed to pipeline task');
    }

    this.hooks = this.hooks || [];
    this._pipeline = new Pipeline(this.hooks);

    this._context = {
      ui: this.ui,
      project: this.project,
      config: this.config,
      appConfig: this.appConfig,
      data: {}
    };

    var addons = this.project.addons;
    addons.forEach(this._registerPluginHooks.bind(this));
  },

  run: function() {
    var pipeline = this._pipeline;
    var context  = this._context;

    return pipeline.run(context);
  },

  _registerPluginHooks: function(addon) {
    var isValidDeployPlugin = this._isValidDeployPlugin(addon);

    if (isValidDeployPlugin) {
      var pluginNameRegex = /^(ember\-cli\-deploy\-)(.*)$/;
      var name            = addon.name.match(pluginNameRegex)[2];
      var pluginHooks     = addon.createDeployPlugin({name: name});

      Object.keys(pluginHooks).forEach(function(hookName) {
        if (hookName !== 'name') {
          var fn = pluginHooks[hookName];

          if (typeof fn === 'function') {
            this._pipeline.register(hookName, fn.bind(pluginHooks));
          }
        }
      }.bind(this));
    }
  },

  _isValidDeployPlugin: function(addon) {
    var keywords = addon.pkg.keywords;
    var hasDeployKeyword = keywords.indexOf('ember-cli-deploy-plugin') > -1;
    var implementsDeploymentHooks = addon.createDeployPlugin && typeof addon.createDeployPlugin === 'function';

    return hasDeployKeyword && implementsDeploymentHooks;
  }
});

