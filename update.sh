git pull
npm ci
npm run build
sudo kill $(sudo lsof -t -i:443)
npm run start