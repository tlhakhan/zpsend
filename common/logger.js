'use strict';

const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'zpsend',
    stream: process.stdout,
    level: 'info'
});

module.exports = log;
