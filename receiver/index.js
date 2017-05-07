'use strict';

const net = require('net');
const connectionListener = require('./worker');
const log = require('../common/logger');

const server = net.createServer();

server.on('connection', (socket) => connectionListener(socket))
    .on('error', (err) => {
        log.error(err);
    });

server.listen({
    host: '0.0.0.0',
    port: 6830
}, () => {
    let {
        address,
        port,
        family
    } = server.address()

    log.info('listening %s: %s:%s', family, address, port);
});
