const debug = require('debug');

module.exports = {
  error: debug('error'),
  enable(enable) {
    debug.enable(enable);
  },
};
