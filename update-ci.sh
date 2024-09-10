#!/usr/bin/env bash

USER="$1"
TOKEN="$2"
OS="$3"
ARCH="$4"

if [[ -z $USER || -z $TOKEN || -z $OS || -z $ARCH ]]; then
    echo "Usage: <GITHUB_USER> <GITHUB_TOKEN> <OS> <ARCH>" 1>&2
    exit 1
fi

REPO="anyproto/anytype-heart"
FILE="addon.tar.gz"
GITHUB="api.github.com"
if [[ "$OS" == "ubuntu-latest" ]]; then
    OS_ARCH="linux-$ARCH"
    FOLDER="$OS_ARCH"
elif [[ "$OS" == "macos-12" ]]; then
    OS_ARCH="darwin-$ARCH"
    FOLDER="$OS_ARCH"
elif [[ "$OS" == "windows-latest" ]]; then
    OS_ARCH="windows"
    FOLDER="dist"
    FILE="addon.zip"
else
    echo "Unsupported OS='$OS'" 1>&2
    exit 1
fi

echo "OS-Arch: $OS_ARCH"
echo "Folder: $FOLDER"
echo ""

MMV=$(cat middleware.version)
VERSION=$(curl --silent --location --user "$USER:$TOKEN" --header "Accept: application/vnd.github.v3+json" "https://$GITHUB/repos/$REPO/releases/tags/v$MMV" | jq .)
ASSET_ID=$(echo $VERSION | jq ".assets | map(select(.name | match(\"js_v[0-9]+.[0-9]+.[0-9]+(-rc[0-9]+)?_${OS_ARCH}\";\"i\")))[0].id")

if [ "$ASSET_ID" = "" ]; then
    echo "ERROR: version not found"
    exit 1
fi

echo "Version: $VERSION"
echo "Found asset: $ASSET_ID"
echo -n "Downloading file..."
curl --silent --location --header "Authorization: token $TOKEN" --header "Accept: application/octet-stream" "https://$GITHUB/repos/$REPO/releases/assets/$ASSET_ID" > $FILE
echo "Done"

if [[ "$OS" = "windows-latest" ]]; then
    echo -n "Uncompressing... "
    unzip $FILE
    echo "Done"

    echo "Moving... "
    mv -fv grpc-server.exe "$FOLDER/anytypeHelper.exe"
else
    echo -n "Uncompressing... "
    tar -zxf $FILE
    echo "Done"

    echo "Moving... "
    rm -rf "$FOLDER"
    mkdir -p "$FOLDER"
    mv -fv grpc-server "$FOLDER/anytypeHelper"
fi

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
