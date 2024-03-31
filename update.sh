git pull
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm ci
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm run build
PID=$(sudo lsof -t -i:443)
sudo kill $PID
/home/ubuntu/.nvm/versions/node/v20.12.0/bin/npm run start