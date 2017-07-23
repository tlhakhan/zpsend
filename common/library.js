const spawn = require('child_process').spawn;
const msgpack = require('msgpack-lite');

function message(type, data) {
    return msgpack.encode({
        type,
        data
    });
}

function fsExists(fs, cb) {
    // zfs get -Hpo value name zones/var
    spawn('zfs', ['get', '-H', '-p', '-o', 'name', 'name', fs])
        .on('close', (code) => {
            if (code === 0) {
                cb(fs);
            } else {
                cb(false);
            }
        });
}

function getOrigin(fs, cb) {
    // zfs get -Hpo value origin zones/var
    let proc = spawn('zfs', ['get', '-H', '-p', '-o', 'value', 'origin', fs])
    let out = [];

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (data) => {
        data = data.trim();
        if (data !== '') {
            out.push(data);
        }
    });
    
    proc.on('close', (code) => {
        out = out.join();
        if (out !== '-') {
            cb(out.trim())
        } else {
            cb(null);
        }
    });
}

function getSnapshotList(fs, cb) {
    // cb([ list of snapshots ])
    // notes:  will return empty list dataset doesn't exist, or no snapshots are on the filesystem.

    let proc = spawn('zfs', ['list', '-H', '-o', 'name', '-r', '-t', 'snapshot', '-d1', '-s', 'creation', fs])
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
            cb(out);
        } else {
            out = out.join();
            out = out.split(/\n/);
            out = out.map(item => item.split(/@/)[1])
            cb(out);
        }
    });
}

module.exports = {
    message,
    getSnapshotList,
    getZfsRecvStream,
    getZfsSendStream
}
