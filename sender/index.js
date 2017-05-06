'use strict';

let net = require('net');
let msgpack = require('msgpack-lite');
let {
    INIT,
    LIST,
    RECV_READY,
    RECV_DONE,
    DONE
} = require('../messages');

const client = net.createConnection({
    port: 6830,
    host: '192.168.100.220'
}, () => {
    console.log('connected');
});

client.on('connect', () => {
    client.write(msgpack.encode({
        type: INIT
    }));
});

client.on('data', (data) => {
    let message = msgpack.decode(data);
    if (message.type) {
        switch (message.type) {
            case INIT:
                console.log('server says its init');
                // let's ask for list
                client.write(msgpack.encode({
                    type: LIST
                }))
                break;
            case LIST:
                console.log('server returned a list');
                break;
            default:
                console.log('unknown message');
        }
    }
});
