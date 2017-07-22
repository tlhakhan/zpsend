'use strict';

const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'zpsend',
    streams: [{
      path: '/var/log/zpsend.log'
    }],
    level: 'info',
});

module.exports = log;
