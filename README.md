## Modules
- `zpsend: receiver`
  - receives zfs filesystem questions from the asker.
- `zpsend: asker`
  - asks the receiver about which filesystem it has and its snapshots.  
  - asker will generate a set of zfs commands so that the receiver can properly receive the filesystems and snapshots.  
  - asker will continue to generate zfs commands for sync until all filesystems are in sync between asker and receiver.

### Helpers
- `setup_receiver.sh` creates the receiver workspace
- `setup_asker.sh` creates the asker workspace

## Setting up the zpsend: receiver

```bash

# make a copy of the setup_receiver.sh script
bash setup_receiver.sh

cd workspace-receiver

# make sure receiver never dies
while true; ./run_zpsend.sh ; sleep 1; done
```

## Setting up the zpsend: asker

```bash

# make a copy of the setup_asker.sh script
bash setup_asker.sh

cd workspace-asker

cp sync_fs.sh zpsend/sync_fs.sh
chmod +x sync_fs.sh

#
# pre-reqs:  make sure your localhost's pub key is in the remote server's authorized keys file
# pre-reqs:  make sure that your remote server has the prefix zfs filesystem created.  prefix filesystem will be the root under which the zfs receives will happen.
#

#
# example usage: ./sync_fs [ remote backup server ] [ filesystem name ] [ local prefix ] [ remote prefix ]
# notes:  local prefix is basically replaced/sed'd by remote prefix .
#

#
# notes:
# if this is a very large nested filesystem of clones and or filesystems underneath the parent filesystem, then put this in a while loop.
# it will continue until no more 'zfs send | recv' commands are generated, since all filesystems will be in sync at the remote location
#

./sync_fs.sh smos-00-bk1 zp99/tank_99/Btenzin zp99/tank_99 backup/zp99/tank_99

```
