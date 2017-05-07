const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');

const {
    INIT,
    LIST,
    ERROR,
    RECV_START,
    RECV_DONE,
    DONE,
    UNKNOWN
} = require('../common/messages');

const {
    getZfsRecvStream,
    getSnapshotList
} = require('../common/library');

function stateFlow(socket) {
    socket.on('data', (data) => {
        let message = msgpack.decode(data);
        if (message.type) {
            switch (message.type) {
                case INIT:
                    socket.write(msgpack.encode({
                        type: INIT
                    }));
                    break;
                case LIST:
                    getSnapshotList(message.fs.name, (list) => {
                        socket.write(msgpack.encode({
                            type: LIST,
                            list
                        }));
                    });
                    break;
                case RECV_START:
                    // setup receive
                    console.log('received message:', message.fs);
                    getZfsRecvStream(message.fs, (recv) => {
                        // then send RECV_START message
                        socket.write(msgpack.encode({
                            type: RECV_START,
                            fs: Object.assign({}, message.fs)
                        }));

                        // client should starting data
                        socket.pipe(recv.stdin);
                        recv.on('close', (code) => {
                            // receive is completed
                            // tell client
                            socket.unpipe(recv.stdin);
                            socket.write(msgpack.encode({
                                type: RECV_DONE
                            }));
                        });
                    });
                    break;
                case DONE:
                    console.log('client asked politely to end connection');
                    socket.end();
                    break;
                default:
                    socket.write(msgpack.encode({
                        type: UNKNOWN
                    }));
                    socket.end();
            }
        }
    })
}

module.exports = stateFlow;
