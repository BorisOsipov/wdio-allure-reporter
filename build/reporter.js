'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _allureJsCommons = require('allure-js-commons');

var _allureJsCommons2 = _interopRequireDefault(_allureJsCommons);

var _step = require('allure-js-commons/beans/step');

var _step2 = _interopRequireDefault(_step);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AllureReporter = function (_events$EventEmitter) {
  (0, _inherits3.default)(AllureReporter, _events$EventEmitter);

  function AllureReporter(baseReporter, config) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    (0, _classCallCheck3.default)(this, AllureReporter);

    var _this = (0, _possibleConstructorReturn3.default)(this, (AllureReporter.__proto__ || (0, _getPrototypeOf2.default)(AllureReporter)).call(this));

    _this.baseReporter = baseReporter;
    _this.config = config;
    _this.options = options;
    _this.allures = {};

    var epilogue = _this.baseReporter.epilogue;


    _this.on('end', function () {
      epilogue.call(baseReporter);
    });

    _this.on('allure:parameters', function (_ref) {
      var cid = _ref.cid,
          data = _ref.data;

      var allure = _this.getAllure(cid);
      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      (0, _keys2.default)(data).forEach(function (key) {
        AllureReporter.dumpText(allure, '' + key, '' + data[key]);
      });
    });

    _this.on('suite:start', function (suite) {
      var setEnvironment = function setEnvironment(allure, environments) {
        if (environments) {
          (0, _keys2.default)(environments).forEach(function (key) {
            AllureReporter.addEnvironment(allure, '' + key, '' + environments[key]);
          });
        }
      };

      var allure = _this.getAllure(suite.cid);

      if (suite.parent) {
        if (suite.title) {
          allure.startCase(suite.title);
          var currentTest = allure.getCurrentTest();
          currentTest.addLabel('thread', suite.cid);

          var currentSuite = allure.getCurrentSuite();
          AllureReporter.addFeature(allure, currentSuite.name);
          setEnvironment(allure, _this.options.environments);
        }
      } else {
        var _currentSuite = allure.getCurrentSuite();
        var prefix = _currentSuite ? _currentSuite.name + ' ' : '';
        allure.startSuite(prefix + suite.title);
      }
    });

    _this.on('suite:end', function (suite) {
      if (suite.parent) {
        if (suite.title) {
          _this.getAllure(suite.cid).endCase('passed');
        }
      } else {
        _this.getAllure(suite.cid).endSuite();
      }
    });

    _this.on('test:start', function (test) {
      var allure = _this.getAllure(test.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }
      if (test.title) {
        allure.startStep(test.title);
      }
    });

    _this.on('test:pass', function (test) {
      var allure = _this.getAllure(test.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      allure.endStep('passed');
    });

    _this.on('test:fail', function (test) {
      if (test.title) {
        var allure = _this.getAllure(test.cid);
        if (!AllureReporter.isAnyTestRunning(allure)) {
          return;
        }

        allure.startStep(test.title);
        var testStack = '' + test.err.stack;
        var status = testStack.includes('AssertionError:') ? 'failed' : 'broken';

        while (allure.getCurrentSuite().currentStep instanceof _step2.default) {
          allure.endStep(status);
        }

        allure.endCase(status, test.err);
      }
    });

    _this.on('test:pending', function (test) {
      if (test.title) {
        _this.getAllure(test.cid).endStep('pending');
      }
    });

    _this.on('runner:result', function (command) {
      var allure = _this.getAllure(command.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      if (command.requestOptions.uri.path.match(/\/wd\/hub\/session\/[^/]*\/screenshot/)) {
        if (command.body.value && _this.options.autoAttachSceenshots) {
          AllureReporter.dumpImage(allure, 'Screenshot', command.body.value);
        }
      }

      if (command.requestOptions.uri.path.match(/\/wd\/hub\/session\/[^/]*\/log/)) {
        if (command.body && _this.options.autoAttachBrowserLogs) {
          AllureReporter.dumpJSON(allure, 'Browser logs', command.body);
        }
      }
    });

    // eslint-disable-next-line no-unused-vars
    _this.on('runner:command', function (command) {});
    // eslint-disable-next-line no-unused-vars
    _this.on('hook:start', function (hook) {});

    // eslint-disable-next-line no-unused-vars
    _this.on('hook:end', function (hook) {});
    return _this;
  }

  (0, _createClass3.default)(AllureReporter, [{
    key: 'getAllure',
    value: function getAllure(cid) {
      if (this.allures[cid]) {
        return this.allures[cid];
      }

      var allure = new _allureJsCommons2.default();
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
      allure.addAttachment(name, (0, _stringify2.default)(json, null, 2), 'application/json');
    }
  }, {
    key: 'dumpText',
    value: function dumpText(allure, name, text) {
      allure.addAttachment(name, Buffer.from('' + text, 'utf8'), 'text/plain');
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
}(_events2.default.EventEmitter);

exports.default = AllureReporter;
module.exports = exports['default'];