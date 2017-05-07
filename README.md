## Progress

### Objectives
- given a filesystem clone or real, send over all descendant snapshots,
- perform snapshot sending using only -i during incremental, this is so that -I doesn't block the deletion of older snapshots as a long sync is in progress.
- receiver can handle multiple independent recvs for arbitary filesystems.
- client is smart, server - not so much.

## Server -- Example Output
```
[2017-05-07T19:17:05.125Z]  INFO: zpsend/21143 on smos-00: received an init message from client
[2017-05-07T19:17:05.125Z]  INFO: zpsend/21143 on smos-00: sending an init message to client
[2017-05-07T19:17:05.128Z]  INFO: zpsend/21143 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:05.150Z]  INFO: zpsend/21143 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:05.150Z]  INFO: zpsend/21143 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:05.189Z]  INFO: zpsend/21143 on smos-00: client is finished, politely asked to end connection
[2017-05-07T19:17:17.052Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.061Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.061Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.091Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.091Z]  INFO: zpsend/11892 on smos-01: 
[2017-05-07T19:17:17.122Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.122Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.122Z]  INFO: zpsend/11892 on smos-01: an initial seed needed
[2017-05-07T19:17:17.122Z]  INFO: zpsend/11892 on smos-01: initial snapshot: zones/test@now
[2017-05-07T19:17:17.122Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.141Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:17.211Z]  INFO: zpsend/11892 on smos-01: server said it successfully received snapshot into zones/test
[2017-05-07T19:17:17.211Z]  INFO: zpsend/11892 on smos-01: initial snapshot: undefined
[2017-05-07T19:17:17.211Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.212Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.212Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.234Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.234Z]  INFO: zpsend/11892 on smos-01: zones/test@now
[2017-05-07T19:17:17.257Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.257Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.257Z]  INFO: zpsend/11892 on smos-01: an incremental send is needed
[2017-05-07T19:17:17.257Z]  INFO: zpsend/11892 on smos-01: from: zones/test@now to: zones/test@now2
[2017-05-07T19:17:17.257Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.257Z]  INFO: zpsend/11892 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@now","snapTo":"zones/test@now2"}
[2017-05-07T19:17:17.274Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:17.335Z]  INFO: zpsend/11892 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:17:17.335Z]  INFO: zpsend/11892 on smos-01: incremental snapshot: undefined - undefined
[2017-05-07T19:17:17.335Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.335Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.335Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.357Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.357Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2
[2017-05-07T19:17:17.377Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.377Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.377Z]  INFO: zpsend/11892 on smos-01: an incremental send is needed
[2017-05-07T19:17:17.377Z]  INFO: zpsend/11892 on smos-01: from: zones/test@now2 to: zones/test@8550
[2017-05-07T19:17:17.377Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.378Z]  INFO: zpsend/11892 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@now2","snapTo":"zones/test@8550"}
[2017-05-07T19:17:17.396Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:17.502Z]  INFO: zpsend/11892 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:17:17.502Z]  INFO: zpsend/11892 on smos-01: incremental snapshot: undefined - undefined
[2017-05-07T19:17:17.502Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.503Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.503Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.526Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.526Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550
[2017-05-07T19:17:17.548Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.548Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.548Z]  INFO: zpsend/11892 on smos-01: an incremental send is needed
[2017-05-07T19:17:17.548Z]  INFO: zpsend/11892 on smos-01: from: zones/test@8550 to: zones/test@18569
[2017-05-07T19:17:17.548Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.548Z]  INFO: zpsend/11892 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@8550","snapTo":"zones/test@18569"}
[2017-05-07T19:17:17.566Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:17.618Z]  INFO: zpsend/11892 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:17:17.618Z]  INFO: zpsend/11892 on smos-01: incremental snapshot: undefined - undefined
[2017-05-07T19:17:17.618Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.620Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.620Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.646Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.646Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569
[2017-05-07T19:17:17.668Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.668Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.668Z]  INFO: zpsend/11892 on smos-01: an incremental send is needed
[2017-05-07T19:17:17.668Z]  INFO: zpsend/11892 on smos-01: from: zones/test@18569 to: zones/test@20392
[2017-05-07T19:17:17.668Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.669Z]  INFO: zpsend/11892 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@18569","snapTo":"zones/test@20392"}
[2017-05-07T19:17:17.689Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:17.754Z]  INFO: zpsend/11892 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:17:17.754Z]  INFO: zpsend/11892 on smos-01: incremental snapshot: undefined - undefined
[2017-05-07T19:17:17.754Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.755Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.755Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.781Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.782Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392
[2017-05-07T19:17:17.803Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.803Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.803Z]  INFO: zpsend/11892 on smos-01: an incremental send is needed
[2017-05-07T19:17:17.803Z]  INFO: zpsend/11892 on smos-01: from: zones/test@20392 to: zones/test@30577
[2017-05-07T19:17:17.803Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.803Z]  INFO: zpsend/11892 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@20392","snapTo":"zones/test@30577"}
[2017-05-07T19:17:17.823Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:17.917Z]  INFO: zpsend/11892 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:17:17.917Z]  INFO: zpsend/11892 on smos-01: incremental snapshot: undefined - undefined
[2017-05-07T19:17:17.917Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:17.919Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:17.919Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:17.943Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:17.943Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577
[2017-05-07T19:17:17.965Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:17.966Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:17.966Z]  INFO: zpsend/11892 on smos-01: an incremental send is needed
[2017-05-07T19:17:17.966Z]  INFO: zpsend/11892 on smos-01: from: zones/test@30577 to: zones/test@4387
[2017-05-07T19:17:17.966Z]  INFO: zpsend/11892 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:17:17.966Z]  INFO: zpsend/11892 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@30577","snapTo":"zones/test@4387"}
[2017-05-07T19:17:17.986Z]  INFO: zpsend/11892 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:17:18.033Z]  INFO: zpsend/11892 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:17:18.036Z]  INFO: zpsend/11892 on smos-01: incremental snapshot: undefined - undefined
[2017-05-07T19:17:18.036Z]  INFO: zpsend/11892 on smos-01: sending init message to server
[2017-05-07T19:17:18.037Z]  INFO: zpsend/11892 on smos-01: received an init message from server
[2017-05-07T19:17:18.037Z]  INFO: zpsend/11892 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:17:18.062Z]  INFO: zpsend/11892 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:17:18.062Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:18.085Z]  INFO: zpsend/11892 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:17:18.085Z]  INFO: zpsend/11892 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:18.085Z]  INFO: zpsend/11892 on smos-01: the server has all my snapshots
[2017-05-07T19:17:18.086Z]  INFO: zpsend/11892 on smos-01: my snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:18.086Z]  INFO: zpsend/11892 on smos-01: server snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:18.086Z]  INFO: zpsend/11892 on smos-01: asking server to end connection
[2017-05-07T19:17:18.088Z]  INFO: zpsend/11892 on smos-01: server closed my connection
```

## Sender - Client Example
```
[2017-05-07T19:17:15.093Z]  INFO: zpsend/21163 on smos-00: listening IPv4: 0.0.0.0:6830
[2017-05-07T19:17:17.054Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.055Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.059Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.087Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.087Z]  INFO: zpsend/21163 on smos-00: 
[2017-05-07T19:17:17.120Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.207Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:17.209Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.209Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.209Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.231Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.231Z]  INFO: zpsend/21163 on smos-00: zones/test@now
[2017-05-07T19:17:17.255Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.255Z]  INFO: zpsend/21163 on smos-00: incremental send
[2017-05-07T19:17:17.331Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:17.332Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.332Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.333Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.353Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.353Z]  INFO: zpsend/21163 on smos-00: zones/test@now, zones/test@now2
[2017-05-07T19:17:17.376Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.376Z]  INFO: zpsend/21163 on smos-00: incremental send
[2017-05-07T19:17:17.498Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:17.500Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.500Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.500Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.522Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.522Z]  INFO: zpsend/21163 on smos-00: zones/test@now, zones/test@now2, zones/test@8550
[2017-05-07T19:17:17.546Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.546Z]  INFO: zpsend/21163 on smos-00: incremental send
[2017-05-07T19:17:17.613Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:17.616Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.616Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.619Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.642Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.642Z]  INFO: zpsend/21163 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569
[2017-05-07T19:17:17.666Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.666Z]  INFO: zpsend/21163 on smos-00: incremental send
[2017-05-07T19:17:17.750Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:17.751Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.751Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.753Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.776Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.777Z]  INFO: zpsend/21163 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392
[2017-05-07T19:17:17.802Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.802Z]  INFO: zpsend/21163 on smos-00: incremental send
[2017-05-07T19:17:17.912Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:17.916Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:17.916Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:17.917Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:17.939Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:17.939Z]  INFO: zpsend/21163 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577
[2017-05-07T19:17:17.963Z]  INFO: zpsend/21163 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:17:17.964Z]  INFO: zpsend/21163 on smos-00: incremental send
[2017-05-07T19:17:18.029Z]  INFO: zpsend/21163 on smos-00: telling client receive is done.
[2017-05-07T19:17:18.034Z]  INFO: zpsend/21163 on smos-00: received an init message from client
[2017-05-07T19:17:18.034Z]  INFO: zpsend/21163 on smos-00: sending an init message to client
[2017-05-07T19:17:18.035Z]  INFO: zpsend/21163 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:17:18.057Z]  INFO: zpsend/21163 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:17:18.058Z]  INFO: zpsend/21163 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:17:18.084Z]  INFO: zpsend/21163 on smos-00: client is finished, politely asked to end connection
```
