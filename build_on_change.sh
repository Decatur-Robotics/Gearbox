#!/bin/bash
REMOTE=origin
BRANCH=main
git fetch
if [[ "$(git rev-parse $BRANCH)" != "$(git rev-parse "$REMOTE/$BRANCH")" ]]; then
  echo "Changes detected"
  git pull
  npm ci
  npm run build
  kill $(lsof -t -i:443)
  npm run start
fi