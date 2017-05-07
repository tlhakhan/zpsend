## Progress

### Objectives
- given a filesystem clone or real, send over all descendant snapshots,
- perform snapshot sending using only -i during incremental, this is so that -I doesn't block the deletion of older snapshots as a long sync is in progress.
- receiver can handle multiple independent recvs for arbitary filesystems.
- client is smart, server - not so much.

### Server -- Receiver
```
[root@smos-00 /zones/zpsend]# node receiver/ | bunyan
[2017-05-07T16:21:47.805Z]  INFO: zpsend/55809 on smos-00: listening IPv4: 0.0.0.0:6830
[2017-05-07T16:21:51.179Z]  INFO: zpsend/55809 on smos-00: received an init message from client
[2017-05-07T16:21:51.179Z]  INFO: zpsend/55809 on smos-00: sending an init message to client
[2017-05-07T16:21:51.184Z]  INFO: zpsend/55809 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T16:21:51.216Z]  INFO: zpsend/55809 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T16:21:51.217Z]  INFO: zpsend/55809 on smos-00: [ 'zones/test@now', 'zones/test@now2' ]
```

### Client -- Sender
```
[root@smos-01 /zones/zpsend]# node sender/ | bunyan
[2017-05-07T16:21:51.175Z]  INFO: zpsend/10925 on smos-01: sending init message to server
[2017-05-07T16:21:51.184Z]  INFO: zpsend/10925 on smos-01: received an init message from server
[2017-05-07T16:21:51.184Z]  INFO: zpsend/10925 on smos-01: asking server to get snapshot list for zones/test
[2017-05-07T16:21:51.219Z]  INFO: zpsend/10925 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T16:21:51.220Z]  INFO: zpsend/10925 on smos-01: [ 'zones/test@now', 'zones/test@now2' ]
```
