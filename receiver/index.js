'use strict';

let net = require('net');
let Receiver = require('./server.js');
const server = net.createServer();

server.on('connection', (socket) => new Receiver(socket))
    .on('error', (err) => {
        console.log(err);
    });

server.listen({
    host: '0.0.0.0',
    port: 6830
}, () => {
    console.log('listening: ', server.address());
});
