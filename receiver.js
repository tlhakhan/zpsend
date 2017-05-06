'use strict';

let net = require('net');

let {
    spawn
} = require('child_process');

class Receiver {
    constructor(socket) {
        this.socket = socket;
        this.proc = spawn('zfs', ['recv', '-v', '-F', 'zones/test'])
            .on('close', (code, signal) => {
                if (code === 0) console.log(`succesfully received filesystem with exit code ${code}, ${signal}`);
                if (code !== 0) console.log(`an error occured on the zfs recv process`);
                this.socket.end();
            })
            .on('error', (err) => {
                console.log(err);
                this.socket.end();
            });
        this.socket.pipe(this.proc.stdin);
        this.proc.stderr.setEncoding('utf8');
        this.proc.stdout.setEncoding('utf8');
        this.proc.stderr.on('data', (data) => console.log(data));
        this.proc.stdout.on('data', (data) => console.log(data));
    }
}

const server = net.createServer()
    .on('connection', (socket) => {
        console.log(`client - ${socket.remoteAddress} - connected.`);
        new Receiver(socket);
    })
    .on('listening', () => {
        console.log(`server is listening.`)
    })
    .on('error', (err) => {
        console.log(err);
    });

server.listen({
    host: '0.0.0.0',
    port: 6830
}, () => {
    console.log('listening on port: ', server.address());
});
