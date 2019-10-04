#!/usr/bin/env bash

REPO="anytypeio/go-anytype-middleware"
FILE="js_v0.0.5_darwin-amd64.tar.gz"
GITHUB="api.github.com"

echo -n "GitHub auth token: "
read -s token
printf "\n"

#185fa730ee27be84392c8e334d1afb808761cdc6

if [ "$token" = "" ]; then
  echo "ERROR: token is empty"
  exit 1
fi;

parser=".[0].assets | map(select(.name == \"$FILE\"))[0].id"
asset_id=`curl -H "Authorization: token $token" -H "Accept: application/vnd.github.v3+json" -sL https://$GITHUB/repos/$REPO/releases | jq "$parser"`

if [ "$asset_id" = "" ]; then
  echo "ERROR: version not found"
  exit 1
fi;

printf "Found asset: $asset_id\n"
echo -n "Downloading file... "
curl -sL -H 'Accept: application/octet-stream' https://$token:@$GITHUB/repos/$REPO/releases/assets/$asset_id > $FILE
printf "Done\n"

echo -n "Uncompressing... "
tar -zxf $FILE
printf "Done\n"

mv addon/*.* build/
rm -rf addon

mv protobuf/commands.js electron/proto/commands.js
rm -rf protobuf
rm -rf $FILE