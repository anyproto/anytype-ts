#!/usr/bin/env bash

REPO="anyproto/anytype-heart"
FILE="addon.tar.gz"
GITHUB="api.github.com"

platform=${1:-ubuntu-latest};
arch=$2;
folder="build";

if [ "$platform" = "ubuntu-latest" ] || [ "$platform" = "ubuntu-22.04" ]; then
  arch="linux-$arch";
  folder="$arch";
elif [ "$platform" = "macos-13" ] || [ "$platform" = "macos-latest" ]; then
  arch="darwin-$arch";
  folder="$arch";
elif [ "$platform" = "windows-latest" ]; then
  arch="windows";
  folder="dist";
  FILE="addon.zip"
fi;

echo "Platform: $platform"
echo "Arch: $arch"
echo "Folder: $folder"
echo ""

if [ "$arch" = "" ]; then
  echo "ERROR: arch not found"
  exit 1
fi;

mwv=`cat middleware.version`

version=`curl -H "Accept: application/vnd.github.v3+json" -sL https://$GITHUB/repos/$REPO/releases/tags/v$mwv | jq .`

tag=`echo $version | jq ".tag_name"`
asset_id=`echo $version | jq ".assets | map(select(.name | match(\"js_v[0-9]+.[0-9]+.[0-9]+([^_]+)?_$arch\";\"i\")))[0].id"`

if [ "$asset_id" = null ]; then
  echo "ERROR: version not found"
  exit 1
fi;

printf "Version: $tag\n"
printf "Found asset: $asset_id\n"
echo -n "Downloading file..."
curl -sL -H 'Accept: application/octet-stream' "https://$GITHUB/repos/$REPO/releases/assets/$asset_id" > $FILE
printf "Done\n"

if [ "$platform" = "windows-latest" ]; then
  echo -n "Uncompressing... "
  unzip $FILE
  printf "Done\n"
  
  echo "Moving... "
  mv -fv grpc-server.exe "$folder/anytypeHelper.exe"
else 
  echo -n "Uncompressing... " 
  tar -zxf $FILE
  printf "Done\n"

  echo "Moving... "
  rm -rf "$folder"
  mkdir -p "$folder"
  mv -fv grpc-server "$folder/anytypeHelper"
fi;

rm -rf dist/lib/pb
rm -rf dist/lib/pkg
rm -rf dist/lib/protos
rm -rf dist/lib/json/generated/*.json

mv -fv protobuf/* "dist/lib/"
mkdir -p dist/lib/json/generated
mv -fv json/* "dist/lib/json/generated"
rm -rf protobuf
rm -rf relations
rm -rf json
rm -rf $FILE

printf "Done\n\n"
