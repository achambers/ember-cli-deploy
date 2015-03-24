/* jshint expr:true */
var PipelineTask = require('../../../lib/utilities/pipeline-task');
var expect = require('chai').expect;
var RSVP = require('rsvp');

var task;
var hookCalled;
var indexHTML;

describe('PipelineTask', function() {
  it('has multiple deployment hooks available', function() {
    var allowedHooks = [
      'willDeploy',
      'build',
      'upload',
      'activate',
      'didDeploy'
    ];

    task = new PipelineTask({config: {project: {addons: []}}});

    Object.keys(task.deploymentHooks).forEach(function(hookName) {
      expect(allowedHooks).to.contain(hookName);
    });
  });

  context('plugin hooks are merged into deployment pipeline', function() {
    beforeEach(function() {
      hookCalled = false;
      indexHTML = '';

      var deploymentPlugin = {
        name: 'ember-cli-deploy-test-plugin',
        createDeployPlugin: function(options) {
          return {
            name: options.name,
            upload: function(html) {
              indexHTML = html;
            },

            didDeploy: function() {
              hookCalled = true;
            }
          }
        },
        pkg: {keywords: ['ember-cli-deploy-plugin']}
      };

      var project = {
        addons: [
          deploymentPlugin
        ]
      };

      task = new PipelineTask({
        config: {project: project}
      });
    });

    it('knows about hooks from installed `ember-cli-deploy`-plugins', function() {
      expect(task.deploymentHooks.didDeploy.length).to.be.gt(0);
    });

    context('#executeDeploymentHook', function() {
      it('can execute deployment-hooks registered from installed `ember-cli-deploy`-plugins', function() {
        task.executeDeploymentHook('didDeploy');

        expect(hookCalled).to.be.ok;
      });

      it('can pass context to the called hooks', function() {
        var newIndexHTML = '<h2>Welcome to Ember.js</h2>'

        task.executeDeploymentHook('upload', newIndexHTML).then(function() {
          expect(indexHTML).to.eql(newIndexHTML);
        });
      });

      it('returns a promise', function() {
        var promise = task.executeDeploymentHook('didDeploy');

        expect(promise.then).to.be.ok;
      });

      it("allows hooks to work with the task's deployment object", function(done) {
        var deployment = {
          data: {
            started: false,
            success: false
          }
        };

        var deploymentAddon = {
          name: 'ember-cli-deploy-test-plugin',
          createDeployPlugin: function(options) {
            return {
              name: options.name,
              willDeploy: function() {
                this.deployment.data.started = true;
                return RSVP.resolve();
              },

              didDeploy: function() {
                this.deployment.data.success = true;
                return RSVP.resolve();
              }
            }
          },
          pkg: {keywords: ['ember-cli-deploy-plugin']}
        };

        var project = {
          addons: [deploymentAddon]
        }

        task = new PipelineTask({
          config: {project: project},
          deployment: deployment,
          run: function() {
            return this.executeDeploymentHook('willDeploy')
              .then(this.executeDeploymentHook('didDeploy'));
          }
        });

        task.run()
          .then(function() {
            expect(deployment.data.started).to.be.ok;
            expect(deployment.data.success).to.be.ok;
            done();
          });
      });
    });
  });
});
