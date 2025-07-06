#!/bin/sh

TAG="$1"
if [ -z "$TAG" ]; then
  echo "Usage: ./scripts/tag.sh <tagname>"
  exit 1
fi

git tag -d "$TAG" 2>/dev/null || true
git tag "$TAG"
git push origin :refs/tags/"$TAG"
git push origin "$TAG"
echo "Tag '$TAG' moved to HEAD and pushed to origin." 