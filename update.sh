git pull
npm ci
npm run build
sudo kill $(lsof -t -i:443)
npm run start