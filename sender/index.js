'use strict';

const net = require('net');
const log = require('../common/logger');
const connection = require('./worker');

const testFs = 'zones/test';

const client = net.createConnection({
    port: 6830,
    host: '192.168.100.220'
}, () => connection(client));


/*
client.on('data', (data) => {
    let message = msgpack.decode(data);
    if (message.type) {
        switch (message.type) {
            case INIT:
                console.log('server says its init');
                // let's ask for list
                client.write(msgpack.encode({
                    type: LIST,
                    fs: {
                        name: testFs
                    }
                }));
                break;
            case LIST:
                console.log('server returned a list');
                console.log(message.list);
                getSnapshotList(testFs, (list) => {
                    // perform list and message.list comparison

                    // check if either list is empty
                    // if my list is empty, then exit, need initial snapshot
                    // if server list is empty, then easy initial seed
                    // if my list and server list is not empty, then find the oldest common snapshot using my list as basis.
                    // if all snapshots match, then no work.
                    // if nothing is in common, then log on server side asking politely to destroy fs.
                    if (list.length > 0) {
                        console.log('my list is not empty', list);
                        console.log(message.list.length);
                        if (message.list.length === 0) {
                            console.log('server list is empty, initial seed needed.');
                            console.log(`asking server to start up receive -- receive ${list[0]}`);
                            client.write(msgpack.encode({
                                type: RECV_START,
                                fs: {
                                    name: testFs,
                                    incremental: false,
                                    snapshot: [list[0]]
                                }
                            }));
                        } else {

                            // need to find common snapshot
                            let commonList = [];

                            for (let i = 0; i <= list.length; i++) {
                                if (message.list[i] === list[i]) {
                                    commonList[i] = list[i];
                                } else {
                                    break;
                                }
                            }

                            // need to check if commonList is the same length as the soruce list
                            if (commonList.length === list.length) {
                                // both list and commonList match, and they shouldn't be empty because caught earlier
                                // no work needs to be done
                                client.write(msgpack.encode({
                                    type: DONE
                                }))
                            } else {
                                console.log('common list');
                                console.log(commonList);
                                console.log('asking server to receive the following snapshots:');
                                console.log(commonList.reverse()[0], list[commonList.length]);
                                client.write(msgpack.encode({
                                    type: RECV_START,
                                    fs: {
                                        name: testFs,
                                        incremental: true,
                                        snapshot: [commonList.reverse()[0], list[commonList.length]]
                                    }
                                }));
                            }
                        }
                    } else {
                        console.log('my list is empty')
                        console.log('recommened to first do a recursive snapshot ')
                        client.write(msgpack.encode({
                            type: DONE
                        }));
                    }
                });
                break;
            case RECV_START:
                // server is ready to receive a filesystem
                console.log('message from server', message.fs);
                getZfsSendStream(message.fs, (send) => {
                    send.stdout.on('data', (data) => client.write(data));
                });
                break;
            case RECV_DONE:
                // server said the receive is done.
                console.log('server said receive is done, check the list again');
                client.write(msgpack.encode({
                    type: LIST,
                    fs: {
                        name: testFs
                    }
                }));
                break;
        }
    }
});
*/
