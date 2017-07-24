const EventEmitter = require('events');
const msgpack = require('msgpack-lite');

const {
    INIT,
    GET_SNAPSHOT_LIST,
    SNAPSHOT_LIST,
    FS_EXISTS,
    ERROR,
    END
} = require('../common/messages');

const {
    message,
    fsExists,
    getOrigin,
    getSnapshotList,
    getFilesystemProperties
} = require('../common/library');

const log = require('../common/logger');

class Worker extends EventEmitter {
    constructor(client, zpsend) {
        super();
        this.client = client;
        this.zpsend = zpsend;

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
            let {
                remote,
                local,
                server
            } = this.zpsend;
            log.info('received an init acknowledge from %s', server);

            log.info('checking existence of local filesystem %s', `${local.name}`);

            fsExists(`${local.name}`, (exists) => {
                if (exists) {
                    // filesystem does exist locally
                    // ask if filesystem exists remotely
                    log.info('local filesystem %s does exist', `${local.name}`)
                    log.info('checking existence of filesystem %s on %s', remote.name, server)
                    this.client.write(message(FS_EXISTS, remote.name));
                } else {
                    // filesystem doesn't exist
                    log.info('local filesystem does not exist', `${local.name}`)
                    log.info('requesting %s to end my connection', server);
                    this.client.write(message(END, null));
                }
            });
        });

        this.on(FS_EXISTS, (exists) => {
            let {
                remote,
                local,
                server
            } = this.zpsend;
            // remote server gave a response

            getOrigin(local.name, (origin) => {
                if (exists) {
                    //log.info('%s does have the local filesystem %s', server, `${local.name}`)
                    //  proceed normally, ask for snapshot and send over missing snapshots
                    // send using -I
                    log.info('asking %s to get the snapshot list of %s', server, local.name)
                    this.client.write(message(GET_SNAPSHOT_LIST, remote.name));
                } else if (!exists && origin) {

                    // then have to create a clone over at the remote location
                    // send using -RI method
                    getSnapshotList(local.name, (localSnapshotList) => {
                        // needs initial seed snapshots
                        if (localSnapshotList.length === 0) {
                            // local fs doesn't have any snapshots, quit
                            log.info('local filesystem %s has no snapshots', local.name);
                            // quit
                            log.info('requesting server to end my connection');
                            this.client.write(message(END, null));
                        } else {
                            log.info('server needs an initial seed needed');
                            log.info('server will be receiving a clone with origin from %s to a last clone snapshot of %s into %s', origin, localSnapshotList[localSnapshotList.length -1], remote.name);
                            let recvFs = {
                                name: remote.name,
                                snapLast: localSnapshotList[localSnapshotList.length -1]
                            };
                            console.log(`"zfs send -v -RI ${origin} ${local.name}@${recvFs.snapLast} | ssh ${server} zfs recv -uF ${remote.name} "`)

                            // quit
                            log.info('requesting server to end my connection');
                            this.client.write(message(END, null));
                        }
                    });
                } else if (!exists && !origin) {
                    // initial filesystem seed is needed
                    getSnapshotList(`${local.name}`, (localSnapshotList) => {
                        // needs initial seed snapshots
                        if (localSnapshotList.length === 0) {
                            // local fs doesn't have any snapshots, quit
                            log.info('local filesystem %s has no snapshots', local.name);
                            // quit
                            log.info('requesting server to end my connection');
                            this.client.write(message(END, null));
                        } else {
                            log.info('server needs an initial seed needed');
                            log.info('server will be receiving an initial snapshot [ %s ]', localSnapshotList[0]);
                            let recvFs = {
                                name: remote.name,
                                snapInitial: [localSnapshotList[0]]
                            };
                            console.log(`"zfs send -v ${local.name}@${recvFs.snapInitial} | ssh ${server} zfs recv -uF ${remote.name} "`)

                            // quit
                            log.info('requesting server to end my connection');
                            this.client.write(message(END, null));
                        }
                    });
                } else {
                  log.error('uncaught case in FS_EXISTS');

                  // quit
                  log.info('requesting server to end my connection');
                  this.client.write(message(END, null));

                }
            })
        })

        this.on(SNAPSHOT_LIST, (remoteSnapshotList) => {
            // data is expected to be an array.
            let {
                remote,
                local,
                server
            } = this.zpsend;

            // get my snapshots
            getSnapshotList(local.name, (localSnapshotList) => {
                if (localSnapshotList.length === 0) {
                    // local filesystem doesn't have any snapshots
                    log.info('local filesystem %s has no snapshots', local.name);
                    // quit
                    log.info('requesting server to end my connection');
                    this.client.write(message(END, null));

                } else if (remoteSnapshotList.length === 0 && localSnapshotList > 0) {
                    // initial filesystem seed is needed
                    log.info('server has no snapshots on %s filesystem', remote.name);
                    // remote server does have the filesystem, but no snapshots.
                } else if (localSnapshotList.length > 0 && remoteSnapshotList.length > 0) {
                    // find common snapshots
                    log.info('found snapshots on my filesystem %s', local.name);
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
                            //quit
                        log.info('requesting server to end my connection');
                        this.client.write(message(END, null));
                    } else if (commonSnapshotList.length === localSnapshotList.length || localSnapshotList[localSnapshotList.length - 1] === remoteSnapshotList[remoteSnapshotList.length - 1]) {
                        // remote list has everything in my list or the last snapshot in my list matches the remote list's last snapshot
                        log.info('the server has all my snapshots, synchronization is complete');
                        log.info('my snapshots: %s', localSnapshotList.join(', '));
                        log.info('server snapshots: %s', remoteSnapshotList.join(', '));
                        log.info('requesting server to end my connection');
                        this.client.write(message(END, null));
                    } else {
                        // incremental send is needed
                        log.info('server needs an incremental send')
                        log.info('server will be receiving a snapshot [ from: %s | to: %s ]', commonSnapshotList[commonSnapshotList.length - 1], localSnapshotList[localSnapshotList.indexOf(commonSnapshotList[commonSnapshotList.length - 1]) + 1]);
                        let snapFrom = commonSnapshotList[commonSnapshotList.length - 1]
                            // for use with -i
                            //let snapTo = localSnapshotList[localSnapshotList.indexOf(commonSnapshotList[commonSnapshotList.length - 1]) + 1]
                            // for use with -I
                        let snapTo = localSnapshotList[localSnapshotList.length - 1]
                        let recvFs = {
                            name: remote.name,
                            incremental: true,
                            snapFrom,
                            snapTo
                        };
                        console.log(`"zfs send -v -I ${local.name}@${recvFs.snapFrom} ${local.name}@${recvFs.snapTo} | ssh ${server} zfs recv -uF ${remote.name} "`)
                            //quit
                        log.info('requesting server to end my connection');
                        this.client.write(message(END, null));
                    }
                } else {
                  log.error('uncaught case in SNAPSHOT_LIST');

                  // quit
                  log.info('requesting server to end my connection');
                  this.client.write(message(END, null));
                }
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
