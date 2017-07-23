'use strict';

const net = require('net');
const log = require('../common/logger');
const connection = require('./worker');

let host = process.env.ZHOST || '127.0.0.1';
let port = process.env.ZPORT || 6830;

let zpsend = {
    local: {
        prefix: process.env.LOCAL_PREFIX || 'zones',
        name: process.env.FS_NAME || 'zones/test'
    },
    remote: {
        prefix: process.env.REMOTE_PREFIX || 'zones/backup',
        get name() {
            return this.local.name.replace(/`^${this.local.prefix}`/, $this.remote.prefix);
        }
    },
    server: host
};

const client = net.createConnection({
    port,
    host
}, () => connection(client, zpsend));
