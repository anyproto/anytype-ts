#!/usr/bin/env bash

# initialize variables
USER=""
TOKEN=""
OS=""
ARCH=""
MIDDLEWARE_VERSION=""

do_usage(){
    cat <<EOF 1>&2

Usage: $0 --user=<GITHUB_USER> --token=<GITHUB_TOKEN> --os=<OS> --middleware-version=<VERSION> [--arch=<ARCH>]

Options:
    --user  - github user
    --token - github token
    --os    - operating system
    --arch  - architecture (optional for os windows)
    --middleware-version - set middleware version

EOF
    exit 1
}

# process named arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --user=*)   USER="${1#*=}";;
        --token=*)  TOKEN="${1#*=}";;
        --os=*)     OS="${1#*=}";;
        --arch=*)   ARCH="${1#*=}";;
        --middleware-version=*) MIDDLEWARE_VERSION="${1#*=}"; shift;;
        *)
            echo "Unknown argument: $1" 1>&2
            do_usage
        ;;
    esac
    shift
done

# check args
if [[ -z $USER || -z $TOKEN || -z $OS || -z $MIDDLEWARE_VERSION ]]; then
    do_usage
fi

REPO="anyproto/anytype-heart"
FILE="addon.tar.gz"
GITHUB="api.github.com"
if [[ "$OS" == "ubuntu-latest" ]]; then
    [[ -z "$ARCH" ]] && do_usage # required for this os
    OS_ARCH="linux-$ARCH"
    FOLDER="$OS_ARCH"
elif [[ "$OS" == "macos-12" ]]; then
    [[ -z "$ARCH" ]] && do_usage # required for this os
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

if [[ $MIDDLEWARE_VERSION == "nightly" ]]; then
    echo -n "Downloading file..."
    curl -sL "$PUBLISH_URL/mw/$ASSET" > $FILE
    echo "Done"
else
    VERSION=$(curl --silent --location --user "$USER:$TOKEN" --header "Accept: application/vnd.github.v3+json" "https://$GITHUB/repos/$REPO/releases/tags/v${MIDDLEWARE_VERSION}" | jq .)
    ASSET_ID=$(echo $VERSION | jq ".assets | map(select(.name | match(\"js_v[0-9]+.[0-9]+.[0-9]+(-rc[0-9]+)?_${OS_ARCH}\";\"i\")))[0].id")

    if [[ "$ASSET_ID" == "" ]]; then
        echo "ERROR: ASSET_ID not found in VERSION='$VERSION'" 1>&2
        exit 1
    fi

    echo "Version: $VERSION"
    echo "Found asset: $ASSET_ID"
    echo -n "Downloading file..."
    curl --silent --location --header "Authorization: token $TOKEN" --header "Accept: application/octet-stream" "https://$GITHUB/repos/$REPO/releases/assets/$ASSET_ID" > $FILE
    echo "Done"
fi

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
