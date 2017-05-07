'use strict';

const net = require('net');
const connectionListener = require('./worker');
const log = require('../common/logger');

const server = net.createServer();

let port = process.env.ZPORT || 6830;

server.on('connection', (socket) => connectionListener(socket))
    .on('error', (err) => {
        log.error(err);
    });

server.listen({
    port
}, () => {
    let {
        address,
        port,
        family
    } = server.address()

    log.info('listening %s: %s:%s', family, address, port);
});
