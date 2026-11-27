#!/usr/bin/env bash

REPO="anyproto/anytype-heart"
FILE="addon.tar.gz"
GITHUB="api.github.com"

platform=${1:-ubuntu-latest};
arch=$2;
folder="dist";

if [ "$platform" = "ubuntu-latest" ] || [ "$platform" = "ubuntu-22.04" ]; then
  arch="linux-$arch";
elif [ "$platform" = "macos-15" ] || [ "$platform" = "macos-latest" ]; then
  arch="darwin-$arch";
elif [ "$platform" = "windows-latest" ]; then
  arch="windows";
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
asset_id=`echo $version | jq ".assets | map(select(.name | match(\"js_(nightly|v[0-9]+.[0-9]+.[0-9]+([^_]+)?)_$arch\";\"i\")))[0].id"`

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
  mcp_ext=".exe"
else
  echo -n "Uncompressing... "
  tar -zxf $FILE
  printf "Done\n"

  echo "Moving... "
  mv -fv grpc-server "$folder/anytypeHelper"
  mcp_ext=""
fi;

# anytype-mcp, the stdio forwarder AI apps start (Connect to AI). A development build takes the
# development-namespace binary, which can never read or write a production key item; the release one is
# only for update-ci.sh. To use a locally built forwarder instead, leave this alone and set
# ANYTYPE_MCP_BIN=<file> for the build (scripts/prepare-forwarder.js).
if [ -f "anytype-mcp-dev$mcp_ext" ]; then
  mv -fv "anytype-mcp-dev$mcp_ext" "$folder/anytype-mcp$mcp_ext"
  chmod +x "$folder/anytype-mcp$mcp_ext"
else
  # Never keep the forwarder of an earlier middleware next to this one
  rm -f "$folder/anytype-mcp$mcp_ext"
  echo "NOTE: this middleware archive has no anytype-mcp-dev$mcp_ext (heart older than the forwarder): Connect to AI's stdio routes are off unless ANYTYPE_MCP_BIN is set"
fi;
rm -f "anytype-mcp-release$mcp_ext" "anytype-mcp-dev$mcp_ext"

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
