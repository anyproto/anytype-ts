#!/usr/bin/env bash

REPO="anytypeio/go-anytype-middleware"
FILE="addon.tar.gz"
GITHUB="api.github.com"

token=$1;
platform=$2;
arch="";

if [ "$platform" = "ubuntu-latest" ]; then
  arch="linux";
elif [ "$platform" = "macos-latest" ]; then
  arch="darwin-amd";
elif [ "$platform" = "macos-10.15" ]; then
  arch="darwin-amd";
elif [ "$platform" = "macos-11" ]; then
  arch="darwin-arm";
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

mwv=`cat middleware.version`

version=`curl -H "Authorization: token $token" -H "Accept: application/vnd.github.v3+json" -sL https://$GITHUB/repos/$REPO/releases/tags/v$mwv | jq .`

tag=`echo $version | jq ".tag_name"`
asset_id=`echo $version | jq ".assets | map(select(.name | match(\"js_v[0-9]+.[0-9]+.[0-9]+(-rc[0-9]+)?_$arch\";\"i\")))[0].id"`

if [ "$asset_id" = "" ]; then
  echo "ERROR: version not found"
  exit 1
fi;

printf "Version: $tag\n"
printf "Found asset: $asset_id\n"
echo -n "Downloading file..."
curl -sL -H "Authorization: token $token" -H 'Accept: application/octet-stream' "https://$GITHUB/repos/$REPO/releases/assets/$asset_id" > $FILE

printf "Done\n"

if [ "$platform" = "windows-latest" ]; then
  echo -n "Uncompressing... "
  unzip $FILE
  printf "Done\n"
  
  echo "Moving... "
  mv -fv grpc-server.exe dist/anytypeHelper.exe
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
rm -rf dist/lib/pkg
rm -rf dist/lib/protos
mv -fv protobuf/* dist/lib/
rm -rf protobuf
rm -rf $FILE
printf "Done\n\n"