const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');

function message(type, data) {
    return msgpack.encode({
        type,
        data
    });
}

function getSnapshotList(fs, cb) {
    // cb([ list of snapshots ])
    // notes:  will return empty list dataset doesn't exist, or no snapshots are on the filesystem.

    let proc = spawn('zfs', ['list', '-H', '-o', 'name', '-r', '-t', 'snapshot', '-d1', '-s', 'creation', fs.name])
    let out = [];

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (data) => {
        data = data.trim();
        if (data != '') {
            out.push(data);
        }
    });

    proc.on('close', (code) => {
        if (out.length === 0) {
            cb(Object.assign({}, fs, {
                list: out
            }));
        } else {
            out = out.join();
            out = out.split(/\n/);
            //console.log('snap list');
            //console.dir(out);
            cb(Object.assign({}, fs, {
                list: out
            }));
        }
    });
}

function getZfsRecvStream(fs, cb) {
    let proc = spawn('zfs', ['recv', '-uF', fs.name]);
    cb(proc);
}

function getZfsSendStream(fs, cb) {
    /*
    fs = {
      name: filesystem name
      incremental: true|false
      snapshot: [initial | from - to]
    }
    */
    if (fs.incremental) {
        let proc = spawn('zfs', ['send', '-i', fs.snapFrom, fs.snapTo]);
        cb(proc);
    } else {
        let proc = spawn('zfs', ['send', fs.snapInitial]);
        cb(proc);
    }
}

module.exports = {
    message,
    getSnapshotList,
    getZfsRecvStream,
    getZfsSendStream
}
