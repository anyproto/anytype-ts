#!/usr/bin/env bash

REPO="anytypeio/go-anytype-middleware"
FILE="addon.tar.gz"
GITHUB="api.github.com"

token=$1;
platform=$2;
arch="";

echo $token;
echo $platform;

if [ "$platform" = "ubuntu-latest" ]; then
	arch="linux";
elif [ "$platform" = "macos-latest" ]; then
	arch="darwin";
elif [ "$platform" = "windows-latest" ]; then
	arch="windows";
  FILE="addon.zip"
fi;

if [ "$token" = "" ]; then
  echo "ERROR: token is empty"
  exit 1
fi;

if [ "$arch" = "" ]; then
  echo "ERROR: arch not found"
  exit 1
fi;

version=`curl -H "Authorization: token $token" -H "Accept: application/vnd.github.v3+json" -sL https://$GITHUB/repos/$REPO/releases | jq ".[0]"`
tag=`echo $version | jq ".tag_name"`
asset_id=`echo $version | jq ".assets | map(select(.name | match(\"js_v[0-9]+.[0-9]+.[0-9]+(-rc[0-9]+)?_$arch\";\"i\")))[0].id"`

if [ "$asset_id" = "" ]; then
  echo "ERROR: version not found"
  exit 1
fi;

printf "Version: $tag\n"
printf "Found asset: $asset_id\n"
echo -n "Downloading file..."
curl -sL -H 'Accept: application/octet-stream' "https://$GITHUB/repos/$REPO/releases/assets/$asset_id?access_token=$token" > $FILE
printf "Done\n"

if [ "$platform" = "windows-latest" ]; then
  echo -n "Uncompressing... "
	unzip $FILE
  printf "Done\n"
  
  echo "Moving... "
  mv -fv grpc-server.exe dist/anytypeHelper.exe
  mv -fv protobuf/pb/* dist/lib/
else 
  echo -n "Uncompressing... "
  tar -zxf $FILE
  printf "Done\n"

  echo "Moving... "
  rm -rf build
  mkdir -p build
  mv -fv addon/* build/
  rm -rf addon
fi;

rm -rf dist/lib/pb
rm -rf dist/lib/vendor
mv -fv protobuf/* dist/lib/
rm -rf protobuf
mv -fv schemas/* src/json/schema
rm -rf schemas
rm -rf $FILE
printf "Done\n"