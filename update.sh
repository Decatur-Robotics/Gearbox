echo "Path: $PWD"
git stash
git pull
git stash apply
NPM=$(which npm)
echo "Version details:"
echo "  Default Node: $(node -v)"
echo "  NPM Version: $($NPM -v)"
$NPM ci
$NPM run build
pid=$(sudo lsof -t -i:443)
echo "Killing process $pid..."
sudo kill $pid
TIMEOUT_SECS=10
timeout $TIMEOUT_SECS tail --pid=$pid -f /dev/null
sudo setcap 'cap_net_bind_service=+ep' $(readlink -f $NPM)
$NPM run start