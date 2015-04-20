var Promise      = require('ember-cli/lib/ext/promise');
var PipelineTask = require('../../../lib/tasks/pipeline');
var expect       = require('chai').expect;
var assert       = require('chai').assert;

describe('PipelineTask', function() {
  var mockProject   = {addons: [], name: function() {return 'mock-project';}};
  var mockConfig    = {};
  var mockAppConfig = {};
  var mockUi        = {};

  describe('creating a new instance', function() {
    it ('raises an error if project is not provided', function() {
      var fn = function() {
        new PipelineTask({});
      };

      expect(fn).to.throw('No project passed to pipeline task');
    });

    it ('raises an error if ui is not provided', function() {
      var fn = function() {
        new PipelineTask({
          project: mockProject,
          config: mockConfig,
          appConfig: mockAppConfig
        });
      };

      expect(fn).to.throw('No ui passed to pipeline task');
    });

    it ('creates the deployment context object', function() {
      var task = new PipelineTask({
        project: mockProject,
        deployEnvironment: 'development',
        deployConfigPath: 'config/deploy.js',
        ui: mockUi
      });

      var context = task._context;

      expect(context.ui).to.equal(mockUi);
      expect(context.config).to.equal(mockConfig);
      expect(context.appConfig).to.equal(mockAppConfig);
      expect(context.data).to.eql({});
    });

    it('registers addons with correct keywords that create the deploy plugin', function() {
      var project = {
        addons: [
          {
            name: 'ember-cli-deploy-test-plugin',
            pkg: {
              keywords: [
                'ember-cli-deploy-plugin'
              ]
            },
            createDeployPlugin: function() {
              return {
                willDeploy: function() {},
                upload: function() {}
              };
            }
          }
        ]
      };

      var task = new PipelineTask({
        project: project,
        ui: mockUi,
        config: mockConfig,
        appConfig: mockAppConfig,
        hooks: ['willDeploy', 'upload']
      });

      var registeredHooks = task._pipeline._pipelineHooks;

      expect(registeredHooks.willDeploy[0]).to.be.a('function');
      expect(registeredHooks.upload[0]).to.be.a('function');
    });

    it('does not register addons missing the correct keywords', function() {
      var project = {
        addons: [
          {
            name: 'ember-cli-deploy-test-plugin',
            pkg: {
              keywords: [ ]
            },
            createDeployPlugin: function() {
              return {
                willDeploy: function() {}
              };
            }
          }
        ]
      };

      var task = new PipelineTask({
        project: project,
        ui: mockUi,
        config: mockConfig,
        appConfig: mockAppConfig,
        hooks: ['build']
      });

      var registeredHooks = task._pipeline._pipelineHooks;

      expect(registeredHooks.willDeploy).to.be.undefined;
    });

    it('does not register addons that don\'t implement the createDeployPlugin function', function() {
      var project = {
        addons: [
          {
            name: 'ember-cli-deploy-test-plugin',
            pkg: {
              keywords: [ ]
            },
            someOtherFunction: function() {
              return {
                willDeploy: function() {}
              };
            }
          }
        ]
      };

      var task = new PipelineTask({
        project: project,
        ui: mockUi,
        config: mockConfig,
        appConfig: mockAppConfig,
        hooks: ['willDeploy']
      });

      var registeredHooks = task._pipeline._pipelineHooks;

      expect(registeredHooks.willDeploy[0]).to.be.undefined;
    });
  });

  describe('running the pipeline task', function() {
    it ('runs the pipeline, passing in the context', function(done) {
      var task = new PipelineTask({
        project: mockProject,
        ui: mockUi,
        config: mockConfig,
        appConfig: mockAppConfig,
        hooks: ['willDeploy']
      });

      task._pipeline = {run: function(context) {
        return Promise.resolve(context);
      }};

      task.run()
        .then(function(context) {
          expect(context).to.eql(task._context);
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });
  });
});
