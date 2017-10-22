import events from 'events';
import Allure from 'allure-js-commons';
import Step from 'allure-js-commons/beans/step';

class AllureReporter extends events.EventEmitter {
  constructor(baseReporter, config, options = {}) {
    super();

    this.baseReporter = baseReporter;
    this.config = config;
    this.options = options;
    this.allures = {};

    const { epilogue } = this.baseReporter;

    this.on('end', () => {
      epilogue.call(baseReporter);
    });

    this.on('add-feature-to-report', ({event, cid, feature, key}) => {
      console.log(`Process ${cid}. We tests feature: ${feature} key: ${key}`);
    });

    this.on('suite:start', (suite) => {
      const setEnvironment = (allure, environments) => {
        if (environments) {
          Object.keys(environments).forEach((key) => {
            AllureReporter.addEnvironment(allure, `${key}`, `${environments[key]}`);
          });
        }
      };

      const allure = this.getAllure(suite.cid);

      if (suite.parent) {
        if (suite.title) {
          allure.startCase(suite.title);
          const currentSuite = allure.getCurrentSuite();
          AllureReporter.addFeature(allure, currentSuite.name);
          setEnvironment(allure, this.options.environments);
        }
      } else {
        const currentSuite = allure.getCurrentSuite();
        const prefix = currentSuite ? `${currentSuite.name} ` : '';
        allure.startSuite(prefix + suite.title);
      }
    });

    this.on('suite:end', (suite) => {
      if (suite.parent) {
        if (suite.title) {
          this.getAllure(suite.cid).endCase('passed');
        }
      } else {
        this.getAllure(suite.cid).endSuite();
      }
    });

    this.on('test:start', (test) => {
      const allure = this.getAllure(test.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }
      if (test.title) {
        allure.startStep(test.title);
      }
    });

    this.on('test:pass', (test) => {
      const allure = this.getAllure(test.cid);

      if (!AllureReporter.isAnyTestRunning(allure)) {
        return;
      }

      allure.endStep('passed');
    });

    this.on('test:fail', (test) => {
      if (test.title) {
        const allure = this.getAllure(test.cid);
        if (!AllureReporter.isAnyTestRunning(allure)) {
          return;
        }

        allure.startStep(test.title);
        const testStack = `${test.err.stack}`;
        const status = testStack.includes('AssertionError:') ? 'failed' : 'broken';

        while (allure.getCurrentSuite().currentStep instanceof Step) {
          allure.endStep(status);
        }

        allure.endCase(status, test.err);
      }
    });

    this.on('test:pending', (test) => {
      if (test.title) {
        this.getAllure(test.cid).endStep('pending');
      }
    });

    this.on('runner:result', (command) => {
      const allure = this.getAllure(command.cid);

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
    this.on('runner:command', (command) => {

    });
    // eslint-disable-next-line no-unused-vars
    this.on('hook:start', (hook) => {

    });

    // eslint-disable-next-line no-unused-vars
    this.on('hook:end', (hook) => {

    });
  }

  getAllure(cid) {
    if (this.allures[cid]) {
      return this.allures[cid];
    }

    const allure = new Allure();
    allure.setOptions({ targetDir: this.options.outputDir || 'allure-results' });
    this.allures[cid] = allure;
    return this.allures[cid];
  }

  static isAnyTestRunning(allure) {
    return allure.getCurrentSuite() && allure.getCurrentTest();
  }

  static dumpJSON(allure, name, json) {
    allure.addAttachment(name, JSON.stringify(json, null, 2), 'application/json');
  }

  static dumpImage(allure, name, image) {
    allure.addAttachment(name, Buffer.from(image, 'base64'));
  }

  static addLabel(allure, name, value) {
    allure.getCurrentTest().addLabel(name, value);
  }

  static addArgument(allure, name, value) {
    allure.getCurrentTest().addParameter('argument', name, value);
  }

  static addEnvironment(allure, name, value) {
    allure.getCurrentTest().addParameter('environment-variable', name, value);
  }

  static addDescription(allure, description) {
    allure.setDescription(description, 'text');
  }

  static addFeature(allure, feature) {
    AllureReporter.addLabel(allure, 'feature', feature);
  }

  static addStory(allure, story) {
    AllureReporter.addLabel(allure, 'story', story);
  }
}

export default AllureReporter;
