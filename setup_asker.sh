#!/bin/bash
# setting up zpsend:asker

BASEDIR_RELATIVE="$(dirname $BASH_SOURCE)"
BASEDIR="$(readlink -f $BASEDIR_RELATIVE)/workspace-asker"

# selected for solaris
LATEST_NODEJS=https://nodejs.org/dist/v6.11.1/node-v6.11.1-sunos-x64.tar.xz

# if this directory exists, exit 1
[[ -d ${BASEDIR} ]] && exit 1

# proceed with setup
mkdir -p ${BASEDIR}

cd ${BASEDIR}
echo "Cloning git repo: zpsend"
git clone https://github.com/tlhakhang/zpsend &> /dev/null

# get the latest nodejs
echo "Downloading nodejs binaries"
curl -s -ko $BASEDIR/nodejs.tar.xz "${LATEST_NODEJS}"

echo "Extracting nodejs archives"
unxz $BASEDIR/nodejs.tar.xz
mkdir $BASEDIR/nodejs
gtar -xf $BASEDIR/nodejs.tar -C $BASEDIR/nodejs --strip-components=1


echo "Installing dependent npm modules"
cd $BASEDIR/zpsend
$BASEDIR/nodejs/bin/npm install

echo "Generating helpful run_zpsend.sh script"
cat <<eof >$BASEDIR/run_zpsend.sh
#!/bin/bash

#
# usage: ./run_zpsend [receiver] [filesystem name] [local prefix] [remote prefix
#
# example: ./run_zpsend batfs-00-bk backup/ja2_14/Bport backup/ja2_14 zp14/ja2_14
#

ZHOST=\$1
LOCAL_PREFIX=\$3
FS_NAME=\$2
REMOTE_PREFIX=\$4

[[ "\$#" -eq "4" ]] || exit 1

# tail bunyan logger
pgrep -f 'tail -F /var/log/zpsend.log' &> /dev/null
if [[ "\$?" -ne "0" ]]
then
  tail -F /var/log/zpsend.log | bunyan &
fi

export ZHOST LOCAL_PREFIX FS_NAME REMOTE_PREFIX
${BASEDIR}/nodejs/bin/node ${BASEDIR}/zpsend/asker  2>> /var/log/zpsend.asker.log
eof

echo "Marking run_zpsend.sh as executable"
chmod +x $BASEDIR/run_zpsend.sh
