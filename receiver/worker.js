const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');
const EventEmitter = require('events');

const {
    INIT,
    SNAPSHOT_LIST,
    GET_SNAPSHOT_LIST,
    RECV_START,
    RECV_DONE,
    ERROR,
    END
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

        this.on(RECV_START, (fs) => {
            // data is expected to be an object.
            /*
            fs = {
              name: filesystem name
              incremental:  true | false
              snapFrom: snapshot name | if incremental is true
              snapTo: snapshot name | if incremental is true
              initialSnap: initial snapshot name | if incremental is false
            }
            */
            log.info('received start zfs recv message from client');
            // starting up recv

            getZfsRecvStream(fs, (proc) => {
                // remove the message processing and dedicate to processing zfs data
                this.socket.removeListener('data', this.messageProcessor);
                
                this.socket.pipe(proc.stdin);

                let errorMessage = [];

                proc.stdin.on('finish', () => {
                    log.debug('zfs recv process stdin has finished');
                });

                proc.stderr.setEncoding('utf8');
                proc.stderr.on('data', (data) => {
                  errorMessage.push(data.replace(/\n/, '').trim());
                });

                proc.on('exit', (code, signal) => {
                    if (code === 0) {
                        log.debug('successfully finished receiving the filesystem %s', fs.name);
                        // done receiving, switch to message processing
                        this.socket.on('data', this.messageProcessor);
                        this.socket.resume();
                        log.info('notifying client zfs recv is done');
                        this.socket.write(message(RECV_DONE, fs));
                    } else {
                        log.error('zfs recv process errored out with %s', code);
                        this.socket.on('data', this.messageProcessor);
                        log.error('zfs recv process said: %s', errorMessage.join(' '));
                        this.socket.resume();
                        this.socket.write(message(ERROR, errorMessage));
                    }
                });

                // tell the client ready to recvFs
                log.info('notifying client ready to zfs recv data');
                this.socket.write(message(RECV_START, fs));
            });

        });

        this.on(END, () => {
            log.info('client is finished sending, politely asked to end connection');
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
