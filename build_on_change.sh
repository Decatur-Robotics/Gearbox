#!/bin/bash
echo "Checking for changes..."
REMOTE=origin
BRANCH=main
cd ./Gearbox
git fetch
if [[ "$(git rev-parse $BRANCH)" != "$(git rev-parse "$REMOTE/$BRANCH")" ]]; then
  echo "Changes detected"
  bash update.sh
else
  echo "No changes detected"
fi