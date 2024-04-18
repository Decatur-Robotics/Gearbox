git stash
git pull
git stash apply
NODE=/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm
echo "Version details:"
echo "\tDefault Node: $(node -v)"
echo "\tFull NPM Version: $($NODE version)"
#
$NODE ci
$NODE run build
pid=$(sudo lsof -t -i:443)
echo "Killing process $pid..."
sudo kill $pid
TIMEOUT_SECS=10
timeout $TIMEOUT_SECS tail --pid=$pid -f /dev/null
sudo setcap 'cap_net_bind_service=+ep' $(readlink -f $NODE)
$NODE run start