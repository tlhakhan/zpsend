const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');
const EventEmitter = require('events');

const {
    INIT,
    SNAPSHOT_LIST,
    GET_SNAPSHOT_LIST,
    FS_EXISTS,
    ERROR,
    END
} = require('../common/messages');

const {
    message,
    fsExists,
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
            log.debug('received an init message from client');
            log.debug('sending an init acknowledge to client');
            this.socket.write(message(INIT, null));
        });

        this.on(FS_EXISTS, (fs) => {
            // fs = filesystem name
            log.info('does %s exist?', fs);
            fsExists(fs, (exists) => {
                if(exists) {
                  log.info('%s does exist', fs);
                } else {
                  log.info('%s does not exist', fs);
                }
                this.socket.write(message(FS_EXISTS, exists))
            });
        });

        this.on(GET_SNAPSHOT_LIST, (fs) => {
            // fs = filesystem name
            log.info('received a get snapshot list message from client for %s', fs);
            getSnapshotList(fs, (snapshotList) => {
                if (snapshotList.length === 0) {
                    log.info('filesystem %s has no snapshots', fs);
                } else {
                    log.info('found snapshots on filesystem %s', fs);
                    log.info(snapshotList.join(', '));
                }
                this.socket.write(message(SNAPSHOT_LIST, snapshotList));
            });
        });

        this.on(END, () => {
            log.debug('client politely asked to end connection');
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
