#!/usr/bin/env bash

REPO="anytypeio/go-anytype-middleware"
FILE="addon.tar.gz"
GITHUB="api.github.com"

echo -n "GitHub auth token: "
read -s token
rintf "\n"

if [ "$token" = "" ]; then
  echo "ERROR: token is empty"
  exit 1
fi;

version=`curl -H "Authorization: token $token" -H "Accept: application/vnd.github.v3+json" -sL https://$GITHUB/repos/$REPO/releases | jq ".[0]"`
tag=`echo $version | jq ".tag_name"`
asset_id=`echo $version | jq ".assets | map(select(.name | match(\"js_\";\"i\")))[0].id"`

if [ "$asset_id" = "" ]; then
  echo "ERROR: version not found"
  exit 1
fi;

printf "Version: $tag\n"
printf "Found asset: $asset_id\n"
echo -n "Downloading file... "
curl -sL -H 'Accept: application/octet-stream' https://$token:@$GITHUB/repos/$REPO/releases/assets/$asset_id > $FILE
printf "Done\n"

echo -n "Uncompressing... "
tar -zxf $FILE
printf "Done\n"

mkdir -p build
mv addon/*.* build/
rm -rf addon

mv protobuf/commands.js src/proto/commands.js
rm -rf protobuf
rm -rf $FILE