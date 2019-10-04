#!/usr/bin/env bash

TOKEN="185fa730ee27be84392c8e334d1afb808761cdc6"
REPO="anytypeio/go-anytype-middleware"
FILE="js_v0.0.5_darwin-amd64.tar.gz"
GITHUB="api.github.com"

function gh_curl() {
  curl -H "Authorization: token $TOKEN" \
       -H "Accept: application/vnd.github.v3.raw" \
       $@
}

parser=".[0].assets | map(select(.name == \"$FILE\"))[0].id"
asset_id=`curl -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.v3+json" -sL https://$GITHUB/repos/$REPO/releases | jq "$parser"`

if [ "$asset_id" = "null" ]; then
  errcho "ERROR: version not found"
  exit 1
fi;

url="https://$TOKEN:@$GITHUB/repos/$REPO/releases/assets/$asset_id"

echo $url 

echo "Found asset: $asset_id"
echo "Downloading file $url... "
curl -sL -H 'Accept: application/octet-stream' $url > $FILE
echo "Done"

echo "Uncompressing... "
tar -zxf $FILE
echo "Done"

mv addon/*.* build/
rm -rf addon
rm -rf $FILE