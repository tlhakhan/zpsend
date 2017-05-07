const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');
const EventEmitter = require('events');

const {
    INIT,
    SNAPSHOT_LIST,
    GET_SNAPSHOT_LIST,
    RECV_START,
} = require('../common/messages');

const {
    message,
    getZfsRecvStream,
    getSnapshotList
} = require('../common/library');

const log = require('../common/logger');

class Worker extends EventEmitter {
    constructor(socket) {
        super();
        this.socket = socket;

        this.on(INIT, (data) => {
            // data is expected to be null.
            log.info('received an init message from client');
            log.info('sending an init message to client');
            this.socket.write(message(INIT, null));
        });

        this.on(GET_SNAPSHOT_LIST, (fs) => {
            // data is expected to be an object.
            log.info('received a get snapshot list message from client for %s', fs.name);
            getSnapshotList(fs, (fs) => {
                log.info('sending client a list of snapshot for %s', fs.name);
                log.info(fs.list);
                this.socket.write(message(SNAPSHOT_LIST, fs));
            })
        });

        this.on(RECV_START, (data) => {
            // data is expected to be an object.
            log.info('received a start zfs recv process message from client');
        });
    }
}



function connectionListener(socket) {
    log.debug('client connected');

    log.debug('creating a worker object');
    const myWorker = new Worker(socket);

    socket.on('data', (data) => {
        log.debug('received data on socket');
        let message = msgpack.decode(data);
        if (message.type) {
            log.debug('received valid message');
            myWorker.emit(message.type, message.data);
        }
    });
}

module.exports = connectionListener;
