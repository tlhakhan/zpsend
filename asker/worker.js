const EventEmitter = require('events');
const msgpack = require('msgpack-lite');

const {
    INIT,
    GET_SNAPSHOT_LIST,
    SNAPSHOT_LIST,
    ERROR,
    END
} = require('../common/messages');

const {
    message,
    getSnapshotList
} = require('../common/library');

const log = require('../common/logger');

class Worker extends EventEmitter {
    constructor(client, filesystem) {
        super();
        this.client = client;
        this.fs = filesystem;

        this.messageProcessor = (data) => {
            log.debug('received data on socket');
            let message = msgpack.decode(data);
            if (message.type) {
                log.debug('received valid message');
                this.emit(message.type, message.data);
            }
        }

        // setup a message listener
        // switch board
        this.client.on('data', this.messageProcessor);

        this.on(INIT, (data) => {
            // data is expected to be null.
            log.info('received an init acknowledge from server');
            log.info('requesting server to get zfs snapshot list for %s', this.fs.remote);
            this.client.write(message(GET_SNAPSHOT_LIST, this.fs.remote));
        });

        this.on(SNAPSHOT_LIST, (remoteSnapshotList) => {
            // data is expected to be an object.

            if (remoteSnapshotList.length === 0) {
                log.info('server has no snapshots on %s filesystem', this.fs.remote);
            } else {
                log.info('received snapshots for %s filesystem from server', this.fs.remote);
                log.info(remoteSnapshotList.join(', '));
            }

            // check if either list is empty
            // if my list is empty, then exit, need initial snapshot
            // if server list is empty, then easy initial seed
            // if my list and server list is not empty, then find the oldest common snapshot using my list as basis.
            // if all snapshots match, then no work.
            // if nothing is in common, then log on server side asking politely to destroy fs.


            // snapshot scenarios
            // 1. my list is  empty
            // 1.1 stop client -- need first snapshot
            // 1.2 notes: the operator may want to perform a recursive snapshot -- zfs snapshot -r [dataset_name]@zpsend
            // 1.2 notes: the operator can perform -- zfs destroy -r [dataset_name]@zpsend -- to recursive remove the snapshot in one go.

            // 2. my list is not empty, server list is empty
            // 2.1 server needs initial seed snapshot

            // 3. my list is not empty, server list is not empty
            // 3.1 find common list

            // 4. common list is empty and server list is not empty
            // 4.1 destination has foreign snapshots -- notify server to destroy its filesystem

            // 5. common list is not empty and server list length is shorter than common list length
            // 5.1 server needs incremental snapshot from the last item in common list and my list [commonList.length]

            // 6. common list is not empty and server list length is greater than common list length
            // 6.1 server has more snapshots than my snapshots
            // 6.2 ensure that the last snapshot on the server is the last snapshot in the common list
            // 6.3 if the last item match, then proceed with 5.
            // 6.4 if the last item does not match, then stop client.  -- the server has newer snapshots than my list.

            // get my snapshots
            getSnapshotList(this.fs.local, (localSnapshotList) => {
                if (localSnapshotList.length === 0) {
                    // my list is empty
                    log.error('no snapshots found on my filesystem %s', this.fs.local);
                    console.log(`echo "no local snapshots for ${this.fs.local}"`)
                } else if (localSnapshotList.length > 0 && remoteSnapshotList.length === 0) {
                    // needs initial seed snapshots
                    log.info('server needs an initial seed needed');
                    log.info('server will be receiving an initial snapshot [ %s ]', localSnapshotList[0]);
                    let recvFs = {
                        name: this.fs.remote,
                        incremental: false,
                        snapInitial: [localSnapshotList[0]]
                    };
                    console.log(`zfs send -v ${this.fs.local}@${recvFs.snapInitial} | ssh ${this.fs.server} zfs recv -uF ${this.fs.remote} &`)
                } else if (localSnapshotList.length > 0 && remoteSnapshotList.length > 0) {
                    // both lists are not empty, need to find common list
                    log.info('found snapshots on my filesystem %s', this.fs.local);
                    log.info(localSnapshotList.join(', '));
                    log.info('finding a common list of snapshots');
                    // finding a common snapshots
                    let commonSnapshotList = localSnapshotList.filter((localSnapshot) => {
                        return remoteSnapshotList.some((remoteSnapshot) => {
                            if (localSnapshot === remoteSnapshot) return true;
                            return false;
                        });
                    });
                    log.info('common snapshot list: %s', commonSnapshotList.join(', '));

                    if (commonSnapshotList.length === 0 && remoteSnapshotList.length > 0) {
                        // no common list found, but server has snapshots
                        log.info('server has no common snapshot');
                        console.log(`echo "no common snapshot found for ${this.fs.local} and ${this.fs.remote}"`)
                    } else if (commonSnapshotList.length === localSnapshotList.length || localSnapshotList[localSnapshotList.length - 1] === remoteSnapshotList[remoteSnapshotList.length - 1]) {
                        // remote list has everything in my list or the last snapshot in my list matches the remote list's last snapshot
                        log.info('the server has all my snapshots, synchronization is complete');
                        log.info('my snapshots: %s', localSnapshotList.join(', '));
                        log.info('server snapshots: %s', remoteSnapshotList.join(', '));
                        console.log(`echo "snapshots are in sync for ${this.fs.local} and ${this.fs.remote}"`)
                    } else if (commonSnapshotList.length > 0 && commonSnapshotList[commonSnapshotList.length - 1] === remoteSnapshotList[remoteSnapshotList.length - 1]) {
                        // incremental send is needed
                        log.info('server needs an incremental send')
                        log.info('server will be receiving a snapshot [ from: %s | to: %s ]', commonSnapshotList[commonSnapshotList.length - 1], localSnapshotList[localSnapshotList.indexOf(commonSnapshotList[commonSnapshotList.length - 1]) + 1]);

                        let snapFrom = commonSnapshotList[commonSnapshotList.length - 1]
                        let snapTo = localSnapshotList[localSnapshotList.indexOf(commonSnapshotList[commonSnapshotList.length - 1]) + 1]

                        let recvFs = {
                            name: this.fs.remote,
                            incremental: true,
                            snapFrom,
                            snapTo
                        };
                        console.log(`zfs send -v -i ${this.fs.local}@${recvFs.snapFrom} ${this.fs.local}@${recvFs.snapTo} | ssh ${this.fs.server} zfs recv -uF ${this.fs.remote} &`)
                    }
                }
                log.info('requesting server to end my connection');
                this.client.write(message(END, null));
            });
        });

        this.on(ERROR, (error) => {
            log.error('server returned error: %s', error);
            log.info('requesting server to end connection');
            this.client.write(message(END, null));
        });
    }
}



function connection(client, filesystem) {
    log.debug('connected to server');

    log.debug('creating a worker object');
    const myWorker = new Worker(client, filesystem);

    log.debug('sending init message to server');
    client.write(message(INIT, null));

    client.on('close', () => {
        log.debug('server closed my connection');
    });
}

module.exports = connection;
