import { tracker } from './loggly';

const VueLoggly = {};
VueLoggly.install = (Vue, opts) => {
  const options = {
    logglyKey: null,
    sendConsoleErrors: false,
    tag: 'javascript-logs',
  };

  Object.keys(opts).forEach((k) => {
    options[k] = opts[k];
  });

  tracker.push(options);
  
  Vue.prototype.$loggly = (tracking) => {
    if (tracking) {
      tracker.push(tracking);
    }
  };
};

export default VueLoggly;
