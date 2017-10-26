#!/bin/bash

# setting up zpsend:receiver
BASEDIR_RELATIVE="$(dirname $BASH_SOURCE)"
BASEDIR="$(readlink -f $BASEDIR_RELATIVE)/workspace-receiver"

# selected for solaris
LATEST_NODEJS="https://nodejs.org/dist/v6.11.1/node-v6.11.1-sunos-x64.tar.xz"

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

# usage: ./run_zpsend

# tail bunyan logger
pgrep -f 'tail -F /var/log/zpsend.log' &> /dev/null
if [[ \$? != 0 ]]
then
  tail -F /var/log/zpsend.log | bunyan &
fi

# loop -- if receiver dies, restart it
while true
do
  ${BASEDIR}/nodejs/bin/node ${BASEDIR}/zpsend/receiver 2>> /var/log/zpsend.receiver.log
done
wait
eof

echo "Marking run_zpsend.sh as executable"
chmod +x $BASEDIR/run_zpsend.sh
