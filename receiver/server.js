const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');
const {
    INIT,
    READY,
    DONE
} = require('../messages');

class Receiver {
    constructor(socket) {
        this.socket = socket;

        this.socket.on('data', (data) => {
            let message = msgpack.decode(data);
            if (message.type) {
                switch (message.type) {
                    case INIT:
                        this.socket.write(msgpack.encode({
                            type: INIT
                        }));
                    case LIST:
                        this.socket.write(msgpack.encode({
                            type: LIST,
                            list: []
                        }));
                        this.socket.end();
                        break;
                    default:
                        this.socket.write(msgpack.encode({
                            type: UNKNOWN
                        }));
                        this.socket.end();
                }
            } else {
                console.log('unknown message');
                this.socket.end();
            }
        })
    }

    receive() {
        console.log('recevived setup-recv')
        this.proc = spawn('zfs', ['recv', '-v', '-F', 'zones/test'])
            .on('close', (code, signal) => {
                if (code === 0) console.log(`succesfully received filesystem with exit code ${code}, ${signal}`);
                if (code !== 0) console.log(`an error occured on the zfs recv process, ${code}, ${signal}`);
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

module.exports = Receiver;
