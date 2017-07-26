## Modules
- zpsend: asker
- zpsend: receiver

### Helpers
- `setup_asker.sh` creates the asker workspace
- `setup_receiver.sh` creates the receiver workspace


## Setting up the zpsend: receiver

```
bash

# make a copy of the setup_receiver.sh script
bash setup_receiver.sh

cd workspace-receiver

# make sure receiver never dies
while true; ./run_zpsend.sh ; sleep 1; done
```

## Setting up the zpsend: asker

```
bash

# make a copy of the setup_asker.sh script
bash setup_asker.sh

cd workspace-asker

cp sync_fs.sh zpsend/sync_fs.sh
chmod +x sync_fs.sh

#
# pre-reqs:  make sure your localhost's pub key is in the server's authorized keys file
# pre-reqs:  make sure that your server has the prefix filesystem created.  prefix filesystem will be the root under which the zfs receives will happen.
#

#
# example usage: ./sync_fs [ remote backup server ] [ filesystem name ] [ local prefix ] [ remote prefix ]
# notes:  local prefix will be substituted by remote prefix.
#

./sync_fs.sh smos-00-bk1 zp99/tank_99/Btenzin zp99/tank_99 backup/zp99/tank_99

```
