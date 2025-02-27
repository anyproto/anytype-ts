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
    --arch  - architecture (required only for os macos)
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
        --middleware-version=*) MIDDLEWARE_VERSION="${1#*=}";;
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
ARCHIVE_SUFFIX="tar.gz"
GITHUB="api.github.com"
if [[ "$OS" =~ ^ubuntu-.*$ ]]; then
    [[ -z "$ARCH" ]] && do_usage # required for this os
    OS_ARCH="linux-${ARCH}64"
    FOLDER="linux-${ARCH}"
elif [[ "$OS" =~ ^macos-.*$ ]]; then
    [[ -z "$ARCH" ]] && do_usage # required for this os
    OS_ARCH="darwin-${ARCH}64"
    FOLDER="darwin-${ARCH}"
elif [[ "$OS" =~ ^windows-.*$ ]]; then
    OS_ARCH="windows-amd64"
    FOLDER="dist"
    ARCHIVE_SUFFIX="zip"
else
    echo "Unsupported OS='$OS'" 1>&2
    exit 1
fi
FILE="addon.$ARCHIVE_SUFFIX"

# debug
cat <<EOF
OS_ARCH=$OS_ARCH
FOLDER=$FOLDER
ARCHIVE_SUFFIX=$ARCHIVE_SUFFIX
FILE=$FILE
MIDDLEWARE_VERSION=$MIDDLEWARE_VERSION

EOF

if [[ $MIDDLEWARE_VERSION == "nightly" ]]; then
    ASSET="js_${MIDDLEWARE_VERSION}_${OS_ARCH}.${ARCHIVE_SUFFIX}"
    echo -n "Downloading file ${DOWNLOAD_ASSETS_URL}/$ASSET ..."
    curl --silent --location "${DOWNLOAD_ASSETS_URL}/$ASSET" > $FILE
else
    VERSION=$(curl --silent --location --user "$USER:$TOKEN" --header "Accept: application/vnd.github.v3+json" "https://$GITHUB/repos/$REPO/releases/tags/v${MIDDLEWARE_VERSION}" | jq .)
    ASSET_ID=$(echo $VERSION | jq ".assets | map(select(.name | match(\"js_v[0-9]+.[0-9]+.[0-9]+(-rc[0-9]+)?_${OS_ARCH}\";\"i\")))[0].id")

    if [[ "$ASSET_ID" == "" ]]; then
        echo "ERROR: ASSET_ID not found in VERSION='$VERSION'" 1>&2
        exit 1
    fi

    echo "Version: $VERSION"
    echo "Found asset: $ASSET_ID"
    echo -n "Downloading file $ASSET_ID ..."
    curl --silent --location --header "Authorization: token $TOKEN" --header "Accept: application/octet-stream" "https://$GITHUB/repos/$REPO/releases/assets/$ASSET_ID" > $FILE
fi
# check download status
if [[ -s $FILE ]]; then
    echo " Done"
else
    echo -e "\nERROR: failed download asset" 1>&2
    exit 1
fi

if [[ "$OS" =~ ^windows-.*$ ]]; then
    echo -n "Uncompressing... "
    unzip $FILE || exit 1
    echo "Done"

    echo "Moving... "
    mv -fv grpc-server.exe "$FOLDER/anytypeHelper.exe"
else
    echo -n "Uncompressing... "
    tar -zxf $FILE || exit 1
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
