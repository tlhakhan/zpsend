// communciation state machine

/*
client => init => server
client <= init <= server
client => list => server
client <= list <= server

// client determines the contents of the list
client => ready-recv => server
client <= ready-recv <= server
client => data..data..data.. => server
client <= done-recv <= server

...
... more receives until done
...

// close connection
client => end => server
client <= end <= server
*/

module.exports = {
    'INIT': 'INIT',
    'LIST': 'LIST',
    'SNAPSHOT_LIST': 'SNAPSHOT_LIST',
    'GET_SNAPSHOT_LIST': 'GET_SNAPSHOT_LIST',
    'RECV_START': 'RECV_START',
    'RECV_DONE': 'RECV_DONE',
    'END': 'END',
    'ERROR': 'ERROR',
    'DONE': 'DONE',
    'END': 'END'
};
