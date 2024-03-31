#!/bin/bash
REMOTE=origin
BRANCH=main
cd ./Gearbox
git fetch
if [[ "$(git rev-parse $BRANCH)" != "$(git rev-parse "$REMOTE/$BRANCH")" ]]; then
  rm -rf ./cd.log
  echo "Deploying new changes at $(date): $(git log -1 --pretty=%B)"
  bash update.sh &
fi