const spawn = require('child_process').spawn;
const EventEmitter = require('events');
const msgpack = require('msgpack-lite');

const {
    INIT,
    GET_SNAPSHOT_LIST,
    SNAPSHOT_LIST,
    RECV_START
} = require('../common/messages');

const {
    message,
    getZfsRecvStream,
    getSnapshotList
} = require('../common/library');

const log = require('../common/logger');

const testFs = 'zones/test';

class Worker extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;

        this.on(INIT, (data) => {
            // data is expected to be null.
            log.info('received an init message from server');
            log.info('asking server to get snapshot list for %s', testFs);
            this.client.write(message(GET_SNAPSHOT_LIST, {
                name: testFs
            }));
        });

        this.on(SNAPSHOT_LIST, (fs) => {
            // data is expected to be an object.
            log.info('received snapshots for %s filesystem from server', fs.name);
            log.info(fs.list);
        });

        this.on(RECV_START, (data) => {
            // data is expected to be an object.
            log.info('received a start zfs recv process message from server');
        });
    }
}



function connection(client) {
    log.debug('connected to server');

    log.debug('creating a worker object');
    const myWorker = new Worker(client);

    log.info('sending init message to server');
    client.write(message(INIT, null));

    client.on('data', (data) => {
        log.debug('received data on socket');
        let message = msgpack.decode(data);
        if (message.type) {
            log.debug('received valid message');
            myWorker.emit(message.type, message.data);
        }
    });
}

module.exports = connection;
