#!/bin/bash

if [[ "$#" != 4 ]]
then
  printf "Usage: ./sync_dataset.sh [ remote server ][ filesystem name ] [ local fs prefix ] [ remote fs prefix ]\n"
  exit 1
fi

REMOTE_SERVER=$1
ZFS_DATASET=$2
LOCAL_PREFIX=$3
REMOTE_PREFIX=$4

BASEDIR=$(dirname $BASH_SOURCE)

printf "Retrieving all non-clone filesystems on %s\n" "$ZFS_DATASET"
# retrieve all non-clone filesystems
zfs list -Hro name,origin -t filesystem $ZFS_DATASET | awk '$2=="-"{print $1}'  > $BASEDIR/rootfs.list

# retrieve all clone-filesystems
printf "Retrieving all clone filesystems on %s\n" "$ZFS_DATASET"
zfs list -Hro name,origin -t filesystem $ZFS_DATASET | awk '$2!="-"{print $1}' > $BASEDIR/clonefs.list

# submit fs list for inquiry
cat rootfs.list | gxargs -P 16 -I{} ${BASEDIR}/run_zpsend.sh $REMOTE_SERVER {} $LOCAL_PREFIX $REMOTE_PREFIX | tee ${BASEDIR}/rootfs.sync.cmds
cat clonefs.list | gxargs -P 16 -I{} ${BASEDIR}/run_zpsend.sh $REMOTE_SERVER {} $LOCAL_PREFIX $REMOTE_PREFIX | tee ${BASEDIR}/clonefs.sync.cmds

# check if sync script is not empty
if [[ -s "${BASEDIR}/rootfs.sync.cmds" ]]
then
  # the ssh batching happens here
  printf "Executing rootfs.sync.cmds\n"
  cat "${BASEDIR}/rootfs.sync.cmds" | gxargs -P 8 -n1 bash -c
else
  printf "The rootfs.sync.cmds has no commands to process.\n"
fi

# check if sync script is not empty
if [[ -s "${BASEDIR}/clonefs.sync.cmds" ]]
then
  # the ssh batching happens here
  printf "Executing clonefs.sync.cmds\n"
  cat "${BASEDIR}/clonefs.sync.cmds" | gxargs -P 8 -n1 bash -c
else
  printf "The clonefs.sync.cmds has no commands to process.\n"
fi

rm
