/* jshint expr:true */
var PipelineTask = require('../../../lib/utilities/pipeline-task');
var expect = require('chai').expect;
var RSVP = require('rsvp');

var pipelineTask;
var hookCalled;
var indexHTML;

describe('PipelineTask', function() {
  it('has multiple deployment hooks available', function() {
    var hooks = [
      'willDeploy',
      'build',
      'upload',
      'activate',
      'didDeploy'
    ];

    pipelineTask = new PipelineTask();

    hooks.forEach(function(hook) {
      expect(pipelineTask.deploymentHooks[hook]).to.be.ok;
    });
  });

  context('plugin hooks are merged into deployment pipeline', function() {
    beforeEach(function() {
      hookCalled = false;
      indexHTML = '';

      var deploymentPlugin = {
        type: 'ember-deploy-addon',
        name: 'Deployment-Plugin',
        hooks: {
          upload: function(html) {
            indexHTML = html;
          },

          didDeploy: function() {
            hookCalled = true;
          }
        }
      };

      var project = {
        addons: [
          deploymentPlugin
        ]
      };

      pipelineTask = new PipelineTask({
        project: project
      });
    });

    it('knows about hooks from installed `ember-cli-deploy`-addons', function() {
      expect(pipelineTask.deploymentHooks.didDeploy.length).to.be.gt(0);
    });

    context('#executeDeploymentHook', function() {
      it('can execute deployment-hooks registered from installed `ember-cli-deploy`-addons', function() {
        pipelineTask.executeDeploymentHook('didDeploy');

        expect(hookCalled).to.be.ok;
      });

      it('can pass context to the called hooks', function() {
        var newIndexHTML = '<h2>Welcome to Ember.js</h2>'

        pipelineTask.executeDeploymentHook('upload', newIndexHTML);

        expect(indexHTML).to.eql(newIndexHTML);
      });

      it('returns a promise', function() {
        var promise = pipelineTask.executeDeploymentHook('didDeploy');

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
          type: 'ember-deploy-addon',
          name: 'Deployment-Plugin',
          hooks: {
            willDeploy: function() {
              this.deployment.data.started = true;
              return RSVP.resolve();
            },

            didDeploy: function() {
              this.deployment.data.success = true;
              return RSVP.resolve();
            }
          }
        };

        var project = {
          addons: [deploymentAddon]
        }

        pipelineTask = new PipelineTask({
          project:project,
          deployment: deployment,
          run: function() {
            return this.executeDeploymentHook('willDeploy')
              .then(this.executeDeploymentHook('didDeploy'));
          }
        });

        pipelineTask.run()
          .then(function() {
            expect(deployment.data.started).to.be.ok;
            expect(deployment.data.success).to.be.ok;
            done();
          });
      });
    });
  });
});
