## zpsend 
### Modules
- `zpsend: receiver`
  - receive zfs filesystems (remote/backup server).
  - receives zfs filesystem questions from the asker.
- `zpsend: asker`
  - client, will send zfs filesystems to remote/backup server.
  - asks the receiver about which filesystem it has and its snapshots.  
  - asker will generate a set of zfs commands so that the receiver can properly receive the filesystems and snapshots.  
  - asker will continue to generate zfs commands for sync until all filesystems are in sync between asker and receiver.

### Helpers
- `setup_receiver.sh`
  - creates the receiver workspace
- `setup_asker.sh`
  - creates the asker workspace

### Starting up the zpsend: receiver

```bash

# make a copy of the setup_receiver.sh script
bash setup_receiver.sh

cd workspace-receiver

# make sure receiver never dies
while true; ./run_zpsend.sh ; sleep 1; done
```

### Starting up the zpsend: asker

```bash

# make a copy of the setup_asker.sh script
bash setup_asker.sh

cd workspace-asker

cp zpsend/sync_fs.sh sync_fs.sh
chmod +x sync_fs.sh

#
# pre-reqs:  make sure your localhost's pub key is in the remote server's authorized keys file
# pre-reqs:  make sure that your remote server has the prefix zfs filesystem created.  prefix filesystem will be the root under which the zfs receives will happen.
#

#
# example usage: ./sync_fs [ remote backup server ] [ filesystem name ] [ local prefix ] [ remote prefix ]
# notes:  local prefix is basically replaced/sed'd by remote prefix .

# example:
## [fs name] [local prefix] [remote prefix]
## zp99/tank_99/Btenzin zp99/tank_99 backup/zp99/tank_99
## local prefix is stripped out from the local name and replaced with the remote prefix to give remote name.
## source filesystem:  zp99/tank_99/Btenzin
## backup filesystem:  backup/zp99/tank_99/Btenzin
#

#
# notes:
# if this is a very large nested filesystem of clones and or filesystems underneath the parent filesystem, then put this in a while loop.
# it will continue until no more 'zfs send | recv' commands are generated, since all filesystems will be in sync at the remote location
#

./sync_fs.sh smos-00-bk1 zp99/tank_99/Btenzin zp99/tank_99 backup/zp99/tank_99

```

### Wish list
- Find a nice zfs + transport mechanism
  - torrent?
  - http?
  - latency sensitive?  zmotion?
- Write in golang
  - Plus:  small binary - compile once and distribute.
  - Plus:  use ansible easily for deployment and service start up.
  - Minus:  javascript's ES6 templating is so very useful and easy.
  - delta:  javascript prototype development is very easy and fast, so is golang's, but need to first dive deeper into its pkg ecosystem.
