'use strict';

const net = require('net');
const log = require('../common/logger');
const connection = require('./worker');

let host = process.env.ZHOST || '127.0.0.1';
let port = process.env.ZPORT || 6830;
let filesystem = {
    name: process.env.ZFILESYSTEM || 'zones/test'
}

const client = net.createConnection({
    port,
    host
}, () => connection(client, filesystem));
