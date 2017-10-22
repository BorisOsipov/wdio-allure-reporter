'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _allureJsCommons = require('allure-js-commons');

var _allureJsCommons2 = _interopRequireDefault(_allureJsCommons);

var _allureJsCommonsBeansStep = require('allure-js-commons/beans/step');

var _allureJsCommonsBeansStep2 = _interopRequireDefault(_allureJsCommonsBeansStep);

var AllureReporter = (function (_events$EventEmitter) {
  _inherits(AllureReporter, _events$EventEmitter);

  function AllureReporter(baseReporter, config) {
    var _this = this;

    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, AllureReporter);

    _get(Object.getPrototypeOf(AllureReporter.prototype), 'constructor', this).call(this);

    this.baseReporter = baseReporter;
    this.config = config;
    this.options = options;
    this.allures = {};

    var epilogue = this.baseReporter.epilogue;

    this.on('end', function () {
      epilogue.call(baseReporter);
    });

    this.on('allure:parameters', function (_ref) {
      var event = _ref.event;
      var cid = _ref.cid;
      var data = _ref.data;

      var allure = _this.getAllure(cid);
      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      _Object$keys(data).forEach(function (key) {
        AllureReporter.dumpText(allure, '' + key, '' + data[key]);
      });
      console.log('Event ' + event + '.');
    });

    this.on('suite:start', function (suite) {
      var setEnvironment = function setEnvironment(allure, environments) {
        if (environments) {
          _Object$keys(environments).forEach(function (key) {
            AllureReporter.addEnvironment(allure, '' + key, '' + environments[key]);
          });
        }
      };

      var allure = _this.getAllure(suite.cid);

      if (suite.parent) {
        if (suite.title) {
          allure.startCase(suite.title);
          var currentSuite = allure.getCurrentSuite();
          AllureReporter.addFeature(allure, currentSuite.name);
          setEnvironment(allure, _this.options.environments);
        }
      } else {
        var currentSuite = allure.getCurrentSuite();
        var prefix = currentSuite ? currentSuite.name + ' ' : '';
        allure.startSuite(prefix + suite.title);
      }
    });

    this.on('suite:end', function (suite) {
      if (suite.parent) {
        if (suite.title) {
          _this.getAllure(suite.cid).endCase('passed');
        }
      } else {
        _this.getAllure(suite.cid).endSuite();
      }
    });

    this.on('test:start', function (test) {
      var allure = _this.getAllure(test.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }
      if (test.title) {
        allure.startStep(test.title);
      }
    });

    this.on('test:pass', function (test) {
      var allure = _this.getAllure(test.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      allure.endStep('passed');
    });

    this.on('test:fail', function (test) {
      if (test.title) {
        var allure = _this.getAllure(test.cid);
        if (!AllureReporter.isAnyTestRunning(allure)) {
          return;
        }

        allure.startStep(test.title);
        var testStack = '' + test.err.stack;
        var _status = testStack.includes('AssertionError:') ? 'failed' : 'broken';

        while (allure.getCurrentSuite().currentStep instanceof _allureJsCommonsBeansStep2['default']) {
          allure.endStep(_status);
        }

        allure.endCase(_status, test.err);
      }
    });

    this.on('test:pending', function (test) {
      if (test.title) {
        _this.getAllure(test.cid).endStep('pending');
      }
    });

    this.on('runner:result', function (command) {
      var allure = _this.getAllure(command.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      if (command.requestOptions.uri.path.match(/\/wd\/hub\/session\/[^/]*\/screenshot/)) {
        AllureReporter.dumpImage(allure, 'Screenshot', command.body.value);
      }

      if (command.requestOptions.uri.path.match(/\/wd\/hub\/session\/[^/]*\/log/)) {
        AllureReporter.dumpJSON(allure, 'Browser logs', command.body);
      }
    });

    // eslint-disable-next-line no-unused-vars
    this.on('runner:command', function (command) {});
    // eslint-disable-next-line no-unused-vars
    this.on('hook:start', function (hook) {});

    // eslint-disable-next-line no-unused-vars
    this.on('hook:end', function (hook) {});
  }

  _createClass(AllureReporter, [{
    key: 'getAllure',
    value: function getAllure(cid) {
      if (this.allures[cid]) {
        return this.allures[cid];
      }

      var allure = new _allureJsCommons2['default']();
      allure.setOptions({ targetDir: this.options.outputDir || 'allure-results' });
      this.allures[cid] = allure;
      return this.allures[cid];
    }
  }], [{
    key: 'isAnyTestRunning',
    value: function isAnyTestRunning(allure) {
      return allure.getCurrentSuite() && allure.getCurrentTest();
    }
  }, {
    key: 'dumpJSON',
    value: function dumpJSON(allure, name, json) {
      allure.addAttachment(name, JSON.stringify(json, null, 2), 'application/json');
    }
  }, {
    key: 'dumpText',
    value: function dumpText(allure, name, text) {
      allure.addAttachment(name, '' + text, 'text/plain');
    }
  }, {
    key: 'dumpImage',
    value: function dumpImage(allure, name, image) {
      allure.addAttachment(name, Buffer.from(image, 'base64'));
    }
  }, {
    key: 'addLabel',
    value: function addLabel(allure, name, value) {
      allure.getCurrentTest().addLabel(name, value);
    }
  }, {
    key: 'addArgument',
    value: function addArgument(allure, name, value) {
      allure.getCurrentTest().addParameter('argument', name, value);
    }
  }, {
    key: 'addEnvironment',
    value: function addEnvironment(allure, name, value) {
      allure.getCurrentTest().addParameter('environment-variable', name, value);
    }
  }, {
    key: 'addDescription',
    value: function addDescription(allure, description) {
      allure.setDescription(description, 'text');
    }
  }, {
    key: 'addFeature',
    value: function addFeature(allure, feature) {
      AllureReporter.addLabel(allure, 'feature', feature);
    }
  }, {
    key: 'addStory',
    value: function addStory(allure, story) {
      AllureReporter.addLabel(allure, 'story', story);
    }
  }]);

  return AllureReporter;
})(_events2['default'].EventEmitter);

exports['default'] = AllureReporter;
module.exports = exports['default'];
