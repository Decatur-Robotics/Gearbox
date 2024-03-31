git pull
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm ci
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm run build
pid=$(sudo lsof -t -i:443)
echo "Killing process $pid..."
sudo kill $PID
TIMEOUT_SECS=10
timeout $TIMEOUT_SECS tail --pid=$pid -f /dev/null
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm run start