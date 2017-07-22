const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');
const EventEmitter = require('events');

const {
    INIT,
    SNAPSHOT_LIST,
    GET_SNAPSHOT_LIST,
    ERROR,
    END
} = require('../common/messages');

const {
    message,
    getSnapshotList
} = require('../common/library');

const log = require('../common/logger');

class Worker extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;

        this.messageProcessor = (data) => {
            log.debug('received data on socket');
            let message = msgpack.decode(data);
            if (message.type) {
                log.debug('received valid message');
                this.emit(message.type, message.data);
            }
        }

        // setup the message processor
        this.socket.on('data', this.messageProcessor);

        this.on(INIT, (data) => {
            // data is expected to be null.
            log.info('received an init message from client');
            log.info('sending an init acknowledge to client');
            this.socket.write(message(INIT, null));
        });

        this.on(GET_SNAPSHOT_LIST, (fs) => {
            // data is expected to be an object.
            log.info('received a get snapshot list message from client for %s', fs.name);
            getSnapshotList(fs, (fs) => {
                if (fs.list.length === 0) {
                    log.info('client requested filesystem %s has no snapshots', fs.name);
                } else {
                    log.info('found snapshots on client requested filesystem %s', fs.name);
                    log.info(fs.list.join(', '));
                }
                this.socket.write(message(SNAPSHOT_LIST, fs));
            });
        });

        this.on(END, () => {
            log.info('client politely asked to end connection');
            this.socket.end();
        });
    }
}

function connectionListener(socket) {
    log.debug('client connected');
    log.debug('creating a worker object');
    const myWorker = new Worker(socket);

}

module.exports = connectionListener;
