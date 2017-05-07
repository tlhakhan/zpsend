const spawn = require('child_process').spawn;

function getSnapshotList(fsName, cb) {
    // cb([ list of snapshots ])
    // notes:  will return empty list dataset doesn't exist, or no snapshots are on the filesystem.

    let proc = spawn('zfs', ['list', '-H', '-o', 'name', '-r', '-t', 'snapshot', '-d1', '-s', 'creation', fsName])
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
            //console.log('snap list');
            //console.dir(out);
            cb(out);
        }
    });
}

function getZfsRecvStream(fs, cb) {
    let proc = spawn('zfs', ['recv', '-F', fs.name]);
    cb(proc);
}

function getZfsSendStream(fs, cb) {
    if (fs.incremental) {
        console.log('performing incremental send');
        console.log(fs);
        let [from, to] = fs.snapshot;
        let proc = spawn('zfs', ['send', '-i', from, to]);
        proc.on('close', (code) => console.log(code))
        cb(proc);
    } else {
        let [initial] = fs.snapshot;
        let proc = spawn('zfs', ['send', initial]);
        cb(proc);
    }
}

module.exports = {
    getSnapshotList,
    getZfsRecvStream,
    getZfsSendStream
}
