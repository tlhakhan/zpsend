const spawn = require('child_process').spawn;
const EventEmitter = require('events');
const msgpack = require('msgpack-lite');

const {
    INIT,
    GET_SNAPSHOT_LIST,
    SNAPSHOT_LIST,
    RECV_START,
    RECV_DONE,
    ERROR,
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

        this.messageProcessor = (data) => {
           log.debug('received data on socket');
            let message = msgpack.decode(data);
            if (message.type) {
                log.debug('received valid message');
                this.emit(message.type, message.data);
            } 
        }
        
        this.on(INIT, (data) => {
            // data is expected to be null.
            log.info('received an init acknowledge from server');
            
            // setup a message listener
            // switch board
            this.client.on('data', this.messageProcessor);
            
            log.info('requesting server to get zfs snapshot list for %s', this.fs.name);
            this.client.write(message(GET_SNAPSHOT_LIST, this.fs));
        });

        this.on(SNAPSHOT_LIST, (remote) => {
            // data is expected to be an object.

            if (remote.list.length === 0) {
                log.info('server has no snapshots on %s filesystem', remote.name);
            } else {
                log.info('received snapshots for %s filesystem from server', remote.name);
                log.info(remote.list.join(', '));
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
            getSnapshotList(this.fs, (fs) => {
                if (fs.list.length === 0) {
                    // my list is empty
                    log.error('no snapshots found on my filesystem %s', this.fs.name);
                    log.info('requesting server to end my connection');
                    this.client.write(message(END, null));
                } else if (fs.list.length > 0 && remote.list.length === 0) {
                    // needs initial seed snapshots
                    log.info('server needs an initial seed needed');
                    log.info('server will be receiving an initial snapshot [ %s ]', fs.list[0]);
                    let recvFs = {
                        name: this.fs.name,
                        incremental: false,
                        snapInitial: [fs.list[0]]
                    };
                    log.info('requesting the server to start up a zfs recv for %s', recvFs.name);
                    this.client.write(message(RECV_START, recvFs));
                } else if (fs.list.length > 0 && remote.list.length > 0) {
                    // both lists are not empty, need to find common list
                    log.info('found snapshots on my filesystem %s', this.fs.name);
                    log.info(fs.list.join(', '));

                    log.info('finding a common list of snapshots');
                    // finding a common snapshots
                    let commonList = fs.list.filter((mySnapshot) => {
                        return remote.list.some((remoteSnapshot) => {
                            if (mySnapshot === remoteSnapshot) return true;
                            return false;
                        });
                    });
                    log.info('common list: %s', commonList.join(', '));

                    if (commonList.length === 0 && remote.list.length > 0) {
                        // no common list found, but server has snapshots
                        log.info('server has no common snapshot');
                        log.info('requesting server to end my connection');
                        this.client.write(message(END, null));
                    } else if (commonList.length === fs.list.length || fs.list[fs.list.length - 1] === remote.list[remote.list.length - 1]) {
                        // remote list has everything in my list or the last snapshot in my list matches the remote list's last snapshot
                        log.info('the server has all my snapshots, synchronization is complete');
                        log.info('my snapshots: %s', fs.list.join(', '));
                        log.info('server snapshots: %s', remote.list.join(', '));

                        log.info('requesting server to end connection');
                        this.client.write(message(END, null));
                    } else if (commonList.length > 0 && commonList[commonList.length - 1] === remote.list[remote.list.length - 1]) {
                        // incremental send is needed
                        log.info('server needs an incremental send')
                        log.info('server will be receiving a snapshot [ from: %s | to: %s ]', commonList[commonList.length - 1], fs.list[fs.list.indexOf(commonList[commonList.length - 1]) + 1]);
                        let recvFs = {
                            name: this.fs.name,
                            incremental: true,
                            snapFrom: commonList[commonList.length - 1],
                            snapTo: fs.list[fs.list.indexOf(commonList[commonList.length - 1]) + 1]
                        };
                        log.info('requesting the server to start up a zfs recv for %s', recvFs.name);
                        log.debug(JSON.stringify(recvFs));
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
            log.info('server notified that it is a ready to zfs recv');
            
            // the socket will be dedicated to receive
            this.client.removeListener('data', this.messageProcessor);
            
            getZfsSendStream(recvFs, (proc) => {
                log.info('successfully set up a zfs send process');
                proc.stdout.on('data', (data) => {
                    this.client.write(data);
                });

                proc.on('close', (code) => {
                    // send completed
                    log.debug('zfs send process finished with code: %s', code);
                    // the socket needs to be reverted to message processing
                    this.client.on('data', this.messageProcessor);
                });
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

    log.info('sending init message to server');
    client.write(message(INIT, null));

    client.on('close', () => {
        log.info('server closed my connection');
    });
}

module.exports = connection;
