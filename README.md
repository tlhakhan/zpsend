## Progress

### Objectives
- Given a filesystem clone or real, send over all descendant snapshots,
- Perform snapshot sending using only -i during incremental, this is so that -I doesn't block the deletion of older snapshots as a long sync is in progress.
- Receiver can handle multiple independent recvs
- Receiver will lock recvs to duplicate filesystems
- Client is smart, server - not so much.

## Starting Up
```
server start:  node receiver/
client start:  node sender/
```

## Background
- [ client ] - wants to send the below snapshots to another server.
```
NAME               USED  AVAIL  REFER  MOUNTPOINT
zones/test        1.11M   236G  1.04M  /zones/test
zones/test@now        0      -    23K  -
zones/test@now2       0      -    23K  -
zones/test@8550     15K      -  1.03M  -
zones/test@18569    15K      -  1.03M  -
zones/test@20392    15K      -  1.03M  -
zones/test@30577    15K      -  1.04M  -
zones/test@4387       0      -  1.04M  -
```

## Server -- Output
```
[2017-05-07T19:28:33.529Z]  INFO: zpsend/21255 on smos-00: listening IPv4: 0.0.0.0:6830
[2017-05-07T19:28:36.225Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:36.225Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:36.230Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:36.262Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:36.262Z]  INFO: zpsend/21255 on smos-00:
[2017-05-07T19:28:36.298Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:36.405Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:36.408Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:36.408Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:36.408Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:36.432Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:36.432Z]  INFO: zpsend/21255 on smos-00: zones/test@now
[2017-05-07T19:28:36.455Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:36.455Z]  INFO: zpsend/21255 on smos-00: incremental send
[2017-05-07T19:28:36.536Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:36.537Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:36.537Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:36.538Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:36.561Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:36.561Z]  INFO: zpsend/21255 on smos-00: zones/test@now, zones/test@now2
[2017-05-07T19:28:36.585Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:36.585Z]  INFO: zpsend/21255 on smos-00: incremental send
[2017-05-07T19:28:36.671Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:36.673Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:36.673Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:36.673Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:36.696Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:36.697Z]  INFO: zpsend/21255 on smos-00: zones/test@now, zones/test@now2, zones/test@8550
[2017-05-07T19:28:36.725Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:36.725Z]  INFO: zpsend/21255 on smos-00: incremental send
[2017-05-07T19:28:36.795Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:36.797Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:36.797Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:36.798Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:36.820Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:36.820Z]  INFO: zpsend/21255 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569
[2017-05-07T19:28:36.846Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:36.846Z]  INFO: zpsend/21255 on smos-00: incremental send
[2017-05-07T19:28:36.931Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:36.932Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:36.932Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:36.933Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:36.957Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:36.957Z]  INFO: zpsend/21255 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392
[2017-05-07T19:28:36.982Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:36.982Z]  INFO: zpsend/21255 on smos-00: incremental send
[2017-05-07T19:28:37.102Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:37.104Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:37.104Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:37.104Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:37.131Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:37.131Z]  INFO: zpsend/21255 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577
[2017-05-07T19:28:37.154Z]  INFO: zpsend/21255 on smos-00: received a start zfs recv process message from client
[2017-05-07T19:28:37.154Z]  INFO: zpsend/21255 on smos-00: incremental send
[2017-05-07T19:28:37.224Z]  INFO: zpsend/21255 on smos-00: telling client receive is done.
[2017-05-07T19:28:37.229Z]  INFO: zpsend/21255 on smos-00: received an init message from client
[2017-05-07T19:28:37.229Z]  INFO: zpsend/21255 on smos-00: sending an init message to client
[2017-05-07T19:28:37.230Z]  INFO: zpsend/21255 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T19:28:37.259Z]  INFO: zpsend/21255 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T19:28:37.259Z]  INFO: zpsend/21255 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:37.283Z]  INFO: zpsend/21255 on smos-00: client is finished, politely asked to end connection
```

## Client -- Example
```
[2017-05-07T19:28:36.223Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:36.231Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:36.231Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:36.266Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:36.266Z]  INFO: zpsend/11918 on smos-01:
[2017-05-07T19:28:36.299Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:36.299Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:36.300Z]  INFO: zpsend/11918 on smos-01: an initial seed needed
[2017-05-07T19:28:36.300Z]  INFO: zpsend/11918 on smos-01: initial snapshot: zones/test@now
[2017-05-07T19:28:36.300Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:36.321Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:36.410Z]  INFO: zpsend/11918 on smos-01: server said it successfully received snapshot into zones/test
[2017-05-07T19:28:36.410Z]  INFO: zpsend/11918 on smos-01: initial snapshot: undefined
[2017-05-07T19:28:36.410Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:36.411Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:36.411Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:36.435Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:36.436Z]  INFO: zpsend/11918 on smos-01: zones/test@now
[2017-05-07T19:28:36.457Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:36.457Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:36.457Z]  INFO: zpsend/11918 on smos-01: an incremental send is needed
[2017-05-07T19:28:36.457Z]  INFO: zpsend/11918 on smos-01: from: zones/test@now to: zones/test@now2
[2017-05-07T19:28:36.457Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:36.457Z]  INFO: zpsend/11918 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@now","snapTo":"zones/test@now2"}
[2017-05-07T19:28:36.477Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:36.539Z]  INFO: zpsend/11918 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:28:36.539Z]  INFO: zpsend/11918 on smos-01: incremental snapshot: zones/test@now - zones/test@now2
[2017-05-07T19:28:36.539Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:36.540Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:36.540Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:36.564Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:36.565Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2
[2017-05-07T19:28:36.587Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:36.587Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:36.587Z]  INFO: zpsend/11918 on smos-01: an incremental send is needed
[2017-05-07T19:28:36.587Z]  INFO: zpsend/11918 on smos-01: from: zones/test@now2 to: zones/test@8550
[2017-05-07T19:28:36.587Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:36.587Z]  INFO: zpsend/11918 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@now2","snapTo":"zones/test@8550"}
[2017-05-07T19:28:36.606Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:36.675Z]  INFO: zpsend/11918 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:28:36.675Z]  INFO: zpsend/11918 on smos-01: incremental snapshot: zones/test@now2 - zones/test@8550
[2017-05-07T19:28:36.675Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:36.675Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:36.675Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:36.702Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:36.702Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550
[2017-05-07T19:28:36.726Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:36.726Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:36.726Z]  INFO: zpsend/11918 on smos-01: an incremental send is needed
[2017-05-07T19:28:36.726Z]  INFO: zpsend/11918 on smos-01: from: zones/test@8550 to: zones/test@18569
[2017-05-07T19:28:36.726Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:36.726Z]  INFO: zpsend/11918 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@8550","snapTo":"zones/test@18569"}
[2017-05-07T19:28:36.746Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:36.798Z]  INFO: zpsend/11918 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:28:36.798Z]  INFO: zpsend/11918 on smos-01: incremental snapshot: zones/test@8550 - zones/test@18569
[2017-05-07T19:28:36.798Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:36.800Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:36.800Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:36.825Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:36.825Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569
[2017-05-07T19:28:36.848Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:36.848Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:36.848Z]  INFO: zpsend/11918 on smos-01: an incremental send is needed
[2017-05-07T19:28:36.848Z]  INFO: zpsend/11918 on smos-01: from: zones/test@18569 to: zones/test@20392
[2017-05-07T19:28:36.848Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:36.848Z]  INFO: zpsend/11918 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@18569","snapTo":"zones/test@20392"}
[2017-05-07T19:28:36.866Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:36.934Z]  INFO: zpsend/11918 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:28:36.934Z]  INFO: zpsend/11918 on smos-01: incremental snapshot: zones/test@18569 - zones/test@20392
[2017-05-07T19:28:36.935Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:36.935Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:36.935Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:36.961Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:36.961Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392
[2017-05-07T19:28:36.981Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:36.982Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:36.984Z]  INFO: zpsend/11918 on smos-01: an incremental send is needed
[2017-05-07T19:28:36.984Z]  INFO: zpsend/11918 on smos-01: from: zones/test@20392 to: zones/test@30577
[2017-05-07T19:28:36.984Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:36.984Z]  INFO: zpsend/11918 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@20392","snapTo":"zones/test@30577"}
[2017-05-07T19:28:37.004Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:37.106Z]  INFO: zpsend/11918 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:28:37.106Z]  INFO: zpsend/11918 on smos-01: incremental snapshot: zones/test@20392 - zones/test@30577
[2017-05-07T19:28:37.106Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:37.107Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:37.107Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:37.134Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:37.134Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577
[2017-05-07T19:28:37.155Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:37.156Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:37.156Z]  INFO: zpsend/11918 on smos-01: an incremental send is needed
[2017-05-07T19:28:37.156Z]  INFO: zpsend/11918 on smos-01: from: zones/test@30577 to: zones/test@4387
[2017-05-07T19:28:37.156Z]  INFO: zpsend/11918 on smos-01: asking the server to start up a recv for zones/test
[2017-05-07T19:28:37.156Z]  INFO: zpsend/11918 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@30577","snapTo":"zones/test@4387"}
[2017-05-07T19:28:37.175Z]  INFO: zpsend/11918 on smos-01: received a ready zfs recv message from server
[2017-05-07T19:28:37.227Z]  INFO: zpsend/11918 on smos-01: server said it successfully received incremental snapshot into zones/test
[2017-05-07T19:28:37.228Z]  INFO: zpsend/11918 on smos-01: incremental snapshot: zones/test@30577 - zones/test@4387
[2017-05-07T19:28:37.228Z]  INFO: zpsend/11918 on smos-01: sending init message to server
[2017-05-07T19:28:37.232Z]  INFO: zpsend/11918 on smos-01: received an init message from server
[2017-05-07T19:28:37.232Z]  INFO: zpsend/11918 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T19:28:37.263Z]  INFO: zpsend/11918 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T19:28:37.263Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:37.285Z]  INFO: zpsend/11918 on smos-01: found the following snapshots on my filesystem zones/test
[2017-05-07T19:28:37.285Z]  INFO: zpsend/11918 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:37.285Z]  INFO: zpsend/11918 on smos-01: the server has all my snapshots
[2017-05-07T19:28:37.285Z]  INFO: zpsend/11918 on smos-01: my snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:37.285Z]  INFO: zpsend/11918 on smos-01: server snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T19:28:37.285Z]  INFO: zpsend/11918 on smos-01: asking server to end connection
[2017-05-07T19:28:37.287Z]  INFO: zpsend/11918 on smos-01: server closed my connection
```
