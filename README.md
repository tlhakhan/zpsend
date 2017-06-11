## Progress Notes
## Updates
- I will be writing this in golang.

### Objectives
- Create a zfs recv daemon server.
  - The daemon will always be running, servicing zfs sends into the server's storage.
  - Security layer can be easily implemented on the net.Socket layer.
- Create a zfs send client.
- Create a robust state machine between the server and client.
  - See ```common/messages``` for messages communicated between the server and client.
  - See ```common/library``` for function libraries that is used between server and client.
    - This contains the setting up a zfs send or zfs recv child processes, and then hooking up the socket's stream into it during appropriate times.
- Client is slightly smart, server - not so much.
  - Client determines if it needs to perform a zfs incremental or initial snapshot send.
  - Client determines common snapshot list and identifies when it's completed syncing.
- Server gives what client wants most of the time.
  - Server will setup the zfs recv process and then tell the client when the socket is ready for a zfs stream.
- Do performance testing, and node cluster testing.
  - Use node cluster to setup multiple zfs recv daemons? -- Central locking scheme may be required for potential duplicate zfs send|recvs.

## Caution
- The zfs recv daemon server does perform a zfs recv with a -F flag, which has an implicit rollback to the last matching snapshot.  So if you have live data in that dataset, please be sure to create a snapshot first, this shouldn't be a worry on a 'replicated/backup' server.

## Starting Up
Notes:  using environment variables to inject variables into the node process, will be more robust later.  If no env variables are given, they will assume sane defaults, -- it can communicate with itself (127.0.0.1), but it will always find all the snapshots, so no sending.
```
[smos-00] server start:  node receiver/
[smos-01] client start:  ZHOST=[ip address of zserver] ZFILESYSTEM=[zfs fs name] node sender/
```

## End state
- discrepancy in used size is due to smos-00 running lz4 compression, and smos-01 using no compression.
- there is only /dev/zero'd files, so compression is very good.
```
[root@smos-00 /zones/zpsend]# zfs list -r -t all zones/test
NAME               USED  AVAIL  REFER  MOUNTPOINT
zones/test          99K   235G    25K  /zones/test
zones/test@now       1K      -    23K  -
zones/test@now2      1K      -    23K  -
zones/test@8550     15K      -    25K  -
zones/test@18569    15K      -    25K  -
zones/test@20392    15K      -    25K  -
zones/test@30577    15K      -    25K  -
zones/test@4387       0      -    25K  -

[root@smos-01 /zones/zpsend]# zfs list -r -t all zones/test
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

## Server -- Example Output
```
[root@smos-00 /zones/zpsend]# ~/destroy_zones_test.sh ; node receiver | bunyan
[2017-05-07T23:26:35.740Z]  INFO: zpsend/21677 on smos-00: listening IPv6: :::6830
[2017-05-07T23:26:42.211Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:42.211Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:42.216Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:42.246Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:42.246Z]  INFO: zpsend/21677 on smos-00:
[2017-05-07T23:26:42.282Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:42.300Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:42.375Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:42.377Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:42.377Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:42.377Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:42.400Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:42.400Z]  INFO: zpsend/21677 on smos-00: zones/test@now
[2017-05-07T23:26:42.422Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:42.439Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:42.502Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:42.503Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:42.503Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:42.504Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:42.525Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:42.526Z]  INFO: zpsend/21677 on smos-00: zones/test@now, zones/test@now2
[2017-05-07T23:26:42.547Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:42.564Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:42.618Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:42.619Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:42.619Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:42.620Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:42.643Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:42.644Z]  INFO: zpsend/21677 on smos-00: zones/test@now, zones/test@now2, zones/test@8550
[2017-05-07T23:26:42.669Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:42.686Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:42.736Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:42.739Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:42.739Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:42.739Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:42.761Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:42.762Z]  INFO: zpsend/21677 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569
[2017-05-07T23:26:42.786Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:42.802Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:42.906Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:42.907Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:42.907Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:42.908Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:42.930Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:42.931Z]  INFO: zpsend/21677 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392
[2017-05-07T23:26:42.954Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:42.971Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:43.025Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:43.026Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:43.026Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:43.027Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:43.050Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:43.050Z]  INFO: zpsend/21677 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577
[2017-05-07T23:26:43.074Z]  INFO: zpsend/21677 on smos-00: received start zfs recv message from client
[2017-05-07T23:26:43.090Z]  INFO: zpsend/21677 on smos-00: notifying client ready to zfs recv data
[2017-05-07T23:26:43.196Z]  INFO: zpsend/21677 on smos-00: notifying client zfs recv is done
[2017-05-07T23:26:43.201Z]  INFO: zpsend/21677 on smos-00: received an init message from client
[2017-05-07T23:26:43.201Z]  INFO: zpsend/21677 on smos-00: sending an init acknowledge to client
[2017-05-07T23:26:43.203Z]  INFO: zpsend/21677 on smos-00: received a get snapshot list message from client for zones/test
[2017-05-07T23:26:43.225Z]  INFO: zpsend/21677 on smos-00: sending client a list of snapshot for zones/test
[2017-05-07T23:26:43.225Z]  INFO: zpsend/21677 on smos-00: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:43.249Z]  INFO: zpsend/21677 on smos-00: client is finished sending, politely asked to end connection
```

## Client -- Example Output
```
[root@smos-01 /zones/zpsend]# ZHOST=192.168.100.220 node sender| bunyan
[2017-05-07T23:26:42.206Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:42.216Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:42.216Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:42.249Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:42.249Z]  INFO: zpsend/12338 on smos-01:
[2017-05-07T23:26:42.282Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:42.282Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:42.282Z]  INFO: zpsend/12338 on smos-01: server needs an initial seed needed
[2017-05-07T23:26:42.282Z]  INFO: zpsend/12338 on smos-01: server will be receiving an initial snapshot: zones/test@now
[2017-05-07T23:26:42.282Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:42.303Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:42.378Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of initial snapshot into zones/test
[2017-05-07T23:26:42.378Z]  INFO: zpsend/12338 on smos-01: server received initial snapshot: zones/test@now
[2017-05-07T23:26:42.378Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:42.378Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:42.378Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:42.403Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:42.403Z]  INFO: zpsend/12338 on smos-01: zones/test@now
[2017-05-07T23:26:42.423Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:42.423Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:42.423Z]  INFO: zpsend/12338 on smos-01: server needs an incremental send
[2017-05-07T23:26:42.423Z]  INFO: zpsend/12338 on smos-01: server will be receiving a snapshot from: zones/test@now to: zones/test@now2
[2017-05-07T23:26:42.423Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:42.423Z]  INFO: zpsend/12338 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@now","snapTo":"zones/test@now2"}
[2017-05-07T23:26:42.441Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:42.504Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of incremental snapshot into zones/test
[2017-05-07T23:26:42.505Z]  INFO: zpsend/12338 on smos-01: server received incremental snapshot from: zones/test@now to: zones/test@now2
[2017-05-07T23:26:42.505Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:42.505Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:42.505Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:42.528Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:42.528Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2
[2017-05-07T23:26:42.548Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:42.548Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:42.548Z]  INFO: zpsend/12338 on smos-01: server needs an incremental send
[2017-05-07T23:26:42.548Z]  INFO: zpsend/12338 on smos-01: server will be receiving a snapshot from: zones/test@now2 to: zones/test@8550
[2017-05-07T23:26:42.548Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:42.548Z]  INFO: zpsend/12338 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@now2","snapTo":"zones/test@8550"}
[2017-05-07T23:26:42.569Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:42.620Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of incremental snapshot into zones/test
[2017-05-07T23:26:42.620Z]  INFO: zpsend/12338 on smos-01: server received incremental snapshot from: zones/test@now2 to: zones/test@8550
[2017-05-07T23:26:42.621Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:42.621Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:42.621Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:42.647Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:42.647Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550
[2017-05-07T23:26:42.669Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:42.669Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:42.669Z]  INFO: zpsend/12338 on smos-01: server needs an incremental send
[2017-05-07T23:26:42.669Z]  INFO: zpsend/12338 on smos-01: server will be receiving a snapshot from: zones/test@8550 to: zones/test@18569
[2017-05-07T23:26:42.670Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:42.670Z]  INFO: zpsend/12338 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@8550","snapTo":"zones/test@18569"}
[2017-05-07T23:26:42.689Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:42.738Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of incremental snapshot into zones/test
[2017-05-07T23:26:42.738Z]  INFO: zpsend/12338 on smos-01: server received incremental snapshot from: zones/test@8550 to: zones/test@18569
[2017-05-07T23:26:42.738Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:42.741Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:42.741Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:42.765Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:42.765Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569
[2017-05-07T23:26:42.786Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:42.786Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:42.786Z]  INFO: zpsend/12338 on smos-01: server needs an incremental send
[2017-05-07T23:26:42.786Z]  INFO: zpsend/12338 on smos-01: server will be receiving a snapshot from: zones/test@18569 to: zones/test@20392
[2017-05-07T23:26:42.787Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:42.787Z]  INFO: zpsend/12338 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@18569","snapTo":"zones/test@20392"}
[2017-05-07T23:26:42.806Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:42.908Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of incremental snapshot into zones/test
[2017-05-07T23:26:42.908Z]  INFO: zpsend/12338 on smos-01: server received incremental snapshot from: zones/test@18569 to: zones/test@20392
[2017-05-07T23:26:42.908Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:42.909Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:42.909Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:42.933Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:42.933Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392
[2017-05-07T23:26:42.953Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:42.955Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:42.955Z]  INFO: zpsend/12338 on smos-01: server needs an incremental send
[2017-05-07T23:26:42.955Z]  INFO: zpsend/12338 on smos-01: server will be receiving a snapshot from: zones/test@20392 to: zones/test@30577
[2017-05-07T23:26:42.955Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:42.955Z]  INFO: zpsend/12338 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@20392","snapTo":"zones/test@30577"}
[2017-05-07T23:26:42.975Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:43.027Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of incremental snapshot into zones/test
[2017-05-07T23:26:43.027Z]  INFO: zpsend/12338 on smos-01: server received incremental snapshot from: zones/test@20392 to: zones/test@30577
[2017-05-07T23:26:43.027Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:43.028Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:43.028Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:43.053Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:43.054Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577
[2017-05-07T23:26:43.075Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:43.075Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:43.075Z]  INFO: zpsend/12338 on smos-01: server needs an incremental send
[2017-05-07T23:26:43.075Z]  INFO: zpsend/12338 on smos-01: server will be receiving a snapshot from: zones/test@30577 to: zones/test@4387
[2017-05-07T23:26:43.075Z]  INFO: zpsend/12338 on smos-01: requesting the server to start up a zfs recv for zones/test
[2017-05-07T23:26:43.075Z]  INFO: zpsend/12338 on smos-01: {"name":"zones/test","incremental":true,"snapFrom":"zones/test@30577","snapTo":"zones/test@4387"}
[2017-05-07T23:26:43.094Z]  INFO: zpsend/12338 on smos-01: received a ready zfs recv message from server
[2017-05-07T23:26:43.202Z]  INFO: zpsend/12338 on smos-01: server notified successful receipt of incremental snapshot into zones/test
[2017-05-07T23:26:43.202Z]  INFO: zpsend/12338 on smos-01: server received incremental snapshot from: zones/test@30577 to: zones/test@4387
[2017-05-07T23:26:43.202Z]  INFO: zpsend/12338 on smos-01: sending init message to server
[2017-05-07T23:26:43.203Z]  INFO: zpsend/12338 on smos-01: received an init acknowledge from server
[2017-05-07T23:26:43.203Z]  INFO: zpsend/12338 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:26:43.227Z]  INFO: zpsend/12338 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:26:43.228Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:43.249Z]  INFO: zpsend/12338 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:26:43.250Z]  INFO: zpsend/12338 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:43.250Z]  INFO: zpsend/12338 on smos-01: the server has all my snapshots, synchronization is complete
[2017-05-07T23:26:43.250Z]  INFO: zpsend/12338 on smos-01: my snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:43.250Z]  INFO: zpsend/12338 on smos-01: server snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:26:43.250Z]  INFO: zpsend/12338 on smos-01: requesting server to end connection
[2017-05-07T23:26:43.252Z]  INFO: zpsend/12338 on smos-01: server closed my connection
```

## Client - Example Subsequent Run
```
[root@smos-01 /zones/zpsend]# ZHOST=192.168.100.220 node sender| bunyan
[2017-05-07T23:30:01.371Z]  INFO: zpsend/12376 on smos-01: sending init message to server
[2017-05-07T23:30:01.377Z]  INFO: zpsend/12376 on smos-01: received an init acknowledge from server
[2017-05-07T23:30:01.377Z]  INFO: zpsend/12376 on smos-01: requesting server to get zfs snapshot list for zones/test
[2017-05-07T23:30:01.404Z]  INFO: zpsend/12376 on smos-01: received snapshots for zones/test filesystem from server
[2017-05-07T23:30:01.404Z]  INFO: zpsend/12376 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:30:01.430Z]  INFO: zpsend/12376 on smos-01: found snapshots on my filesystem zones/test
[2017-05-07T23:30:01.430Z]  INFO: zpsend/12376 on smos-01: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:30:01.430Z]  INFO: zpsend/12376 on smos-01: the server has all my snapshots, synchronization is complete
[2017-05-07T23:30:01.430Z]  INFO: zpsend/12376 on smos-01: my snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:30:01.430Z]  INFO: zpsend/12376 on smos-01: server snapshots: zones/test@now, zones/test@now2, zones/test@8550, zones/test@18569, zones/test@20392, zones/test@30577, zones/test@4387
[2017-05-07T23:30:01.430Z]  INFO: zpsend/12376 on smos-01: requesting server to end connection
[2017-05-07T23:30:01.432Z]  INFO: zpsend/12376 on smos-01: server closed my connection
```
