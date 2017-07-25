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
    getSnapshotList
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
            //
            let {
                remote,
                local,
                server
            } = this.zpsend;
            log.debug('received an init acknowledge from %s', server);

            log.info('does filesystem %s exist locally?', local.name);

            fsExists(local.name, (exists) => {
                if (exists) {
                    // filesystem does exist locally
                    // ask if filesystem exists remotely
                    log.info('local filesystem %s does exist', local.name)
                    log.info('does filesystem %s exist on %s', remote.name, server)
                    this.client.write(message(FS_EXISTS, remote.name));
                } else {
                    // filesystem doesn't exist
                    log.error('local filesystem %s does not exist', local.name)
                    log.debug('requesting %s to end my connection', server);
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
                    log.info('local filesystem %s does exist on %s', local.name, server);

                    //log.info('%s does have the local filesystem %s', server, local.name)
                    //  proceed normally, ask for snapshot and send over missing snapshots
                    // send using -I
                    log.info('asking %s to get the snapshot list of %s', server, local.name)
                    this.client.write(message(GET_SNAPSHOT_LIST, remote.name));
                } else if (!exists && origin) {
                  log.info('local filesystem %s does not exist on %s', local.name, server);
                    // then have to create a clone over at the remote location
                    // send using -RI method
                    getSnapshotList(local.name, (localSnapshotList) => {
                        // needs initial seed snapshots
                        if (localSnapshotList.length === 0) {
                            // local fs doesn't have any snapshots, quit
                            log.error('local filesystem %s has no snapshots', local.name);
                            // quit
                            log.debug('requesting server to end my connection');
                            this.client.write(message(END, null));
                        } else {
                            let recvFs = {
                                name: remote.name,
                                snapLast: localSnapshotList[localSnapshotList.length - 1]
                            };
                            log.info(`server will be receiving an recursive incremental from origin snapshot ${origin} to ${local.name}@${recvFs.snapLast} into ${remote.name}`);
                            console.log(`"zfs send -v -RI ${origin} ${local.name}@${recvFs.snapLast} | ssh ${server} zfs recv -uF ${remote.name}"`)

                            // quit
                            log.debug('requesting server to end my connection');
                            this.client.write(message(END, null));
                        }
                    });
                } else if (!exists && !origin) {
                  log.info('local filesystem %s does not exist on %s', local.name, server);

                    // initial filesystem seed is needed
                    getSnapshotList(local.name, (localSnapshotList) => {
                        // needs initial seed snapshots
                        if (localSnapshotList.length === 0) {
                            // local fs doesn't have any snapshots, quit
                            log.error('local filesystem %s has no snapshots', local.name);
                            // quit
                            log.debug('requesting server to end my connection');
                            this.client.write(message(END, null));
                        } else {
                            let recvFs = {
                                name: remote.name,
                                snapInitial: [localSnapshotList[0]]
                            };
                            log.info(`server will be receiving an initial snapshot ${local.name}@${recvFs.snapInitial} into ${remote.name}`);
                            console.log(`"zfs send -v ${local.name}@${recvFs.snapInitial} | ssh ${server} zfs recv -uF ${remote.name}"`)
                                // quit
                            log.debug('requesting server to end my connection');
                            this.client.write(message(END, null));
                        }
                    });
                } else {
                    log.error('uncaught case in FS_EXISTS');

                    // quit
                    log.debug('requesting server to end my connection');
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
                if (localSnapshotList.length == 0) {
                    // local filesystem doesn't have any snapshots
                    log.error('local filesystem %s has no snapshots', local.name);
                    // quit
                    log.debug('requesting server to end my connection');
                    this.client.write(message(END, null));

                } else if (remoteSnapshotList.length == 0 && localSnapshotList.length > 0) {
                    // initial filesystem seed is needed
                    log.info('server does have filesystem %s, but has no snapshots', local.name);

                    // remote server does have the filesystem, but no snapshots.
                    let recvFs = {
                        name: remote.name,
                        snapInitial: [localSnapshotList[0]]
                    };

                    log.info(`server will be receiving an initial snapshot ${local.name}@${recvFs.snapInitial} into ${remote.name}`);
                    console.log(`"zfs send -v ${local.name}@${recvFs.snapInitial} | ssh ${server} zfs recv -uF ${remote.name}"`)

                    log.debug('requesting server to end my connection');
                    this.client.write(message(END, null));
                } else if (localSnapshotList.length > 0 && remoteSnapshotList.length > 0) {
                    // find common snapshots
                    log.info('found snapshots on my filesystem %s: %s', local.name, localSnapshotList.join(','));
                    // not observed here, but the localSnapshotList and remoteSnapshotList are ordered by creation time in the common/library.getSnapshotList
                    let commonSnapshotList = localSnapshotList.filter((localSnapshot) => {
                        return remoteSnapshotList.some((remoteSnapshot) => {
                            if (localSnapshot === remoteSnapshot) return true;
                            return false;
                        });
                    });

                    if (commonSnapshotList.length == 0 && remoteSnapshotList.length > 0) {
                        // no common list found, but server has snapshots
                        log.error('server has no common snapshot');
                        //quit
                        log.debug('requesting server to end my connection');
                        this.client.write(message(END, null));
                    } else if (commonSnapshotList.length === localSnapshotList.length || localSnapshotList[localSnapshotList.length - 1] === remoteSnapshotList[remoteSnapshotList.length - 1]) {
                        // remote list has everything in my list or the last snapshot in my list matches the remote list's last snapshot
                        log.info('the server has all my snapshots, ~~[[ sync is complete ]]~~');
                        // log.info('my snapshots: %s', localSnapshotList.join(', '));
                        // log.info('server snapshots: %s', remoteSnapshotList.join(', '));
                        log.debug('requesting server to end my connection');
                        this.client.write(message(END, null));
                    } else {
                        // incremental send is needed
                        let snapFrom = commonSnapshotList[commonSnapshotList.length - 1]
                            // for use with -i
                            //let snapTo = localSnapshotList[localSnapshotList.indexOf(commonSnapshotList[commonSnapshotList.length - 1]) + 1]
                            // for use with -I
                        let snapTo = localSnapshotList[localSnapshotList.length - 1]
                        let recvFs = {
                            name: remote.name,
                            snapFrom,
                            snapTo
                        };
                        log.info(`server will be receiving a snapshot from: ${local.name}@${recvFs.snapFrom} to: ${local.name}@${recvFs.snapTo}`);
                        console.log(`"zfs send -v -I ${local.name}@${recvFs.snapFrom} ${local.name}@${recvFs.snapTo} | ssh ${server} zfs recv -uF ${remote.name}"`)
                            //quit
                        log.debug('requesting server to end my connection');
                        this.client.write(message(END, null));
                    }
                } else {
                    log.error('uncaught case in SNAPSHOT_LIST');
                    log.error('localSnapshotList length: %s', localSnapshotList.length);
                    log.error('localSnapshotList: %s', localSnapshotList.join(',') );
                    //
                    log.error('remoteSnapshotList length: %s', remoteSnapshotList.length);
                    log.error('remoteSnapshotList: %s', remoteSnapshotList.join(','));
                    // quit
                    log.debug('requesting server to end my connection');
                    this.client.write(message(END, null));
                }
            });
        });

        this.on(ERROR, (error) => {
            log.error('server returned error: %s', error);
            log.debug('requesting server to end my connection');
            this.client.write(message(END, null));
        });
    }
}

function connection(client, zpsend) {
    log.debug('connected to server');

    log.debug('creating a worker object');
    const myWorker = new Worker(client, zpsend);

    log.debug('sending init message to server');
    client.write(message(INIT, null));

    client.on('close', () => {
        log.debug('server closed my connection');
    });
}

module.exports = connection;
