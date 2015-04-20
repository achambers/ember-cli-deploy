var expect = require('chai').expect;
var Pipeline = require('../../../lib/utilities/pipeline');

describe ('Pipeline', function() {
  describe ('initialization', function() {
    it ('initializes the given list of hooks', function() {
      var subject = new Pipeline(['willDeploy', 'didDeploy']);

      expect(Object.keys(subject._pipelineHooks).length).to.eq(2);
      expect(subject._pipelineHooks.willDeploy).to.eql([]);
      expect(subject._pipelineHooks.didDeploy).to.eql([]);
    });
  });

  describe ('registering functions', function() {
    it ('registers functions for defined hooks', function() {
      var subject = new Pipeline(['willDeploy']);
      var fn      = function() {};

      subject.register('willDeploy', fn);

      expect(subject._pipelineHooks.willDeploy.length).to.eq(1)
      expect(subject._pipelineHooks.willDeploy[0]).to.eql(fn);
    });

    it ('doesn\'t register functions for hooks not defined', function() {
      var subject = new Pipeline(['willDeploy']);
      var fn      = function() {};

      subject.register('build', fn);

      expect(subject._pipelineHooks.willDeploy.length).to.eq(0)
      expect(subject._pipelineHooks.build).to.eq(undefined);
    });
  });

  describe ('running the pipeline', function() {
    it ('runs the registered functions', function(done) {
      var subject = new Pipeline(['hook1', 'hook2']);
      var hooksRun = [];

      subject.register('hook1', function() {
        hooksRun.push('1');
      });

      subject.register('hook2', function() {
        hooksRun.push('2');
      });

      subject.run()
        .then(function() {
          expect(hooksRun.length).to.eq(2);
          expect(hooksRun[0]).to.eq('1');
          expect(hooksRun[1]).to.eq('2');
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });

    it ('passes the context to each function', function(done) {
      var subject = new Pipeline(['hook1']);
      var hooksRun = [];

      subject.register('hook1', function(context) {
        expect(context.test).to.eq('a');
        context.test = 'b';
      });

      subject.register('hook1', function(context) {
        expect(context.test).to.eq('b');
      });

      subject.run({test: 'a'})
        .then(function() {
          done();
        })
        .catch(function(error) {
          done(error);
        });
    });
  });
});
