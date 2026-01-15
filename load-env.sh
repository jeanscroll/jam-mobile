#!/bin/bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [[ "$BRANCH" == "staging" ]]; then
  cp .env.staging .env
elif [[ "$BRANCH" == "production" ]]; then
  cp .env.production .env
elif [[ "$BRANCH" == "local-sasha" ]]; then
  cp .env.local-sasha .env
fi

echo "✅ Fichier .env mis à jour pour la branche $BRANCH"