const spawn = require('child_process').spawn;
const EventEmitter = require('events');
const msgpack = require('msgpack-lite');

const {
    INIT,
    GET_SNAPSHOT_LIST,
    SNAPSHOT_LIST,
    RECV_START,
    RECV_DONE,
    END
} = require('../common/messages');

const {
    message,
    getZfsSendStream,
    getSnapshotList
} = require('../common/library');

const log = require('../common/logger');

const testFs = {
    name: 'zones/test'
};

class Worker extends EventEmitter {
    constructor(client, filesystem) {
        super();
        this.client = client;
        this.fs = filesystem;

        this.on(INIT, (data) => {
            // data is expected to be null.
            log.info('received an init acknowledge from server');
            log.info('requesting server to get zfs snapshot list for %s', this.fs.name);
            this.client.write(message(GET_SNAPSHOT_LIST, this.fs));
        })

        this.on(SNAPSHOT_LIST, (remote) => {
            // data is expected to be an object.
            log.info('received snapshots for %s filesystem from server', remote.name);
            log.info(remote.list.join(', '));

            // check if either list is empty
            // if my list is empty, then exit, need initial snapshot
            // if server list is empty, then easy initial seed
            // if my list and server list is not empty, then find the oldest common snapshot using my list as basis.
            // if all snapshots match, then no work.
            // if nothing is in common, then log on server side asking politely to destroy fs.

            // get my snapshots
            getSnapshotList(this.fs, (fs) => {
                if (fs.list.length === 0) {
                    // my list is empty
                    log.error('no snapshots found on my filesystem %s', this.fs.name);
                    log.error('please create an inital snapshot the filesystem');
                    this.client.end();
                } else {
                    log.info('found snapshots on my filesystem %s', this.fs.name);
                    log.info(fs.list.join(', '));

                    // finding a common snapshots
                    let commonList = remote.list.filter((snapshot, index) => {
                        if (remote.list[index] && snapshot === fs.list[index]) {
                            return true;
                        } else {
                            return false;
                        }
                    });

                    if (commonList.length === 0) {
                        // initial seed to server needed.
                        log.info('server needs an initial seed needed');
                        log.info('server will be receiving an initial snapshot: %s', fs.list[0]);
                        let recvFs = {
                            name: this.fs.name,
                            incremental: false,
                            snapInitial: [fs.list[0]]
                        };

                        log.info('requesting the server to start up a zfs recv for %s', recvFs.name);
                        this.client.write(message(RECV_START, recvFs));

                    } else if (commonList.length === fs.list.length) {
                        // the remote list has everything in my snapshot list
                        log.info('the server has all my snapshots, synchronization is complete');
                        log.info('my snapshots: %s', fs.list.join(', '));
                        log.info('server snapshots: %s', remote.list.join(', '));

                        log.info('requesting server to end connection');
                        this.client.write(message(END, null));
                    } else {
                        // incremental snapshot needed, find the oldest common snapshot
                        log.info('server needs an incremental send')
                        log.info('server will be receiving a snapshot from: %s to: %s', commonList[commonList.length - 1], fs.list[commonList.length]);
                        let recvFs = {
                            name: this.fs.name,
                            incremental: true,
                            snapFrom: commonList[commonList.length - 1],
                            snapTo: fs.list[commonList.length]
                        };
                        log.info('requesting the server to start up a zfs recv for %s', recvFs.name);
                        log.info(JSON.stringify(recvFs));
                        this.client.write(message(RECV_START, recvFs));
                    }
                }
            });
        });

        this.on(RECV_DONE, (recvFs) => {
            if (recvFs.incremental) {
                log.info('server notified successful receipt of incremental snapshot into %s', recvFs.name);
                log.info('server received incremental snapshot from: %s to: %s', recvFs.snapFrom, recvFs.snapTo);
            } else {
                log.info('server notified successful receipt of initial snapshot into %s', recvFs.name);
                log.info('server received initial snapshot: %s', recvFs.snapInitial);
            }
            log.info('sending init message to server');
            this.client.write(message(INIT, null));
        });

        this.on(RECV_START, (recvFs) => {
            // data is expected to be an object.
            log.info('received a ready zfs recv message from server');

            getZfsSendStream(recvFs, (proc) => {
                proc.stdout.on('data', (data) => {
                    this.client.write(data);
                });

                proc.on('close', (code) => {
                    // send completed
                    log.debug('zfs send process finished with code: %s', code);
                });
            });
        });
    }
}



function connection(client, filesystem) {
    log.debug('connected to server');

    log.debug('creating a worker object');
    const myWorker = new Worker(client, filesystem);

    log.info('sending init message to server');
    client.write(message(INIT, null));

    // switch board
    client.on('data', (data) => {
        log.debug('received data on socket');
        let message = msgpack.decode(data);
        if (message.type) {
            log.debug('received valid message');
            myWorker.emit(message.type, message.data);
        }
    });

    client.on('close', () => {
        log.info('server closed my connection');
    });
}

module.exports = connection;
