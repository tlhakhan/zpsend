'use strict';

let net = require('net');
let stateFlow = require('./logic.js');
const server = net.createServer();

server.on('connection', (socket) => stateFlow(socket))
    .on('error', (err) => {
        console.log(err);
    });

server.listen({
    host: '0.0.0.0',
    port: 6830
}, () => {
    console.log('listening: ', server.address());
});
