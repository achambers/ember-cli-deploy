module.exports = {
  name: 'deploy',
  description: 'Deploys an ember-cli app',
  works: 'insideProject',

  availableOptions: [
    { name: 'environment', type: String, default: 'development', aliases: ['e',{'dev' : 'development'}, {'prod' : 'production'}] },
    { name: 'deploy-config-file', type: String, default: 'config/deploy.js' }
  ],

  run: function(commandOptions, rawArgs) {
    var PipelineTask = require('../tasks/pipeline');
    var pipeline = new PipelineTask({
      project: this.project,
      ui: this.ui,
      deployEnvironment: commandOptions.environment,
      deployConfigPath: commandOptions.deployConfigFile,
      hooks: ['wilLDeploy', 'build', 'upload', 'activate', 'didDeploy']
    });

    return pipeline.run();
  }
};
