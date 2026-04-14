#!/usr/bin/env bash
# Generates TypeScript protobuf bindings from .proto files using ts-proto.
#
# Usage:
#   bash scripts/generate-protos.sh              # use ../anytype-heart
#   bash scripts/generate-protos.sh --from-dist  # use dist/lib/protos (CI)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MIDDLEWARE_DIR="$ROOT_DIR/middleware"
TS_PROTO_JS="$ROOT_DIR/node_modules/ts-proto/protoc-gen-ts_proto"

FROM_DIST=false
if [[ "${1:-}" == "--from-dist" ]]; then
	FROM_DIST=true
fi

if [[ ! -f "$TS_PROTO_JS" ]]; then
	echo "Error: ts-proto not found at $TS_PROTO_JS. Run 'bun install' first."
	exit 1
fi

if ! command -v protoc &> /dev/null; then
	echo "Error: protoc not found. Install protobuf compiler."
	exit 1
fi

# Create a wrapper that protoc can execute as a plugin.
IS_WINDOWS=false
case "$(uname -s)" in
	MINGW*|MSYS*|CYGWIN*) IS_WINDOWS=true ;;
esac

if [[ "$IS_WINDOWS" == true ]]; then
	WRAPPER="$(mktemp -t protoc-plugin-XXXXXX).cmd"
	WIN_NODE="$(cygpath -w "$(command -v node)")"
	WIN_SCRIPT="$(cygpath -w "$TS_PROTO_JS")"
	printf '@"%s" "%s"\r\n' "$WIN_NODE" "$WIN_SCRIPT" > "$WRAPPER"
else
	WRAPPER="$(mktemp)"
	chmod +x "$WRAPPER"
	printf '#!/usr/bin/env node\nrequire("%s/node_modules/ts-proto/build/src/plugin")\n' "$ROOT_DIR" > "$WRAPPER"
fi

# Create a temp directory with the proto file structure that matches import paths
PROTO_ROOT="$(mktemp -d)"
trap 'rm -rf "$PROTO_ROOT" "$WRAPPER"' EXIT

if [[ "$FROM_DIST" == true ]]; then
	# CI mode: use .proto files downloaded by update-ci.sh into dist/lib/protos/
	PROTO_SRC="$ROOT_DIR/dist/lib/protos"
	if [[ ! -d "$PROTO_SRC" ]]; then
		echo "Error: dist/lib/protos not found. Run update-ci.sh first."
		exit 1
	fi

	# pb/protos/ — commands, events, changes, snapshot
	mkdir -p "$PROTO_ROOT/pb/protos"
	cp "$PROTO_SRC/commands.proto" "$PROTO_ROOT/pb/protos/"
	cp "$PROTO_SRC/events.proto" "$PROTO_ROOT/pb/protos/"
	cp "$PROTO_SRC/changes.proto" "$PROTO_ROOT/pb/protos/"
	cp "$PROTO_SRC/snapshot.proto" "$PROTO_ROOT/pb/protos/"

	# pkg/lib/pb/model/protos/ — models, localstore
	mkdir -p "$PROTO_ROOT/pkg/lib/pb/model/protos"
	cp "$PROTO_SRC/models.proto" "$PROTO_ROOT/pkg/lib/pb/model/protos/"
	cp "$PROTO_SRC/localstore.proto" "$PROTO_ROOT/pkg/lib/pb/model/protos/"
else
	# Local mode: use anytype-heart repo
	HEART_DIR="$ROOT_DIR/../anytype-heart"
	if [[ ! -d "$HEART_DIR" ]]; then
		echo "Error: anytype-heart repo not found at $HEART_DIR"
		exit 1
	fi

	# Rebuild the JS dev binary from anytype-heart
	echo "Building anytype-heart JS dev binary..."
	(cd "$HEART_DIR" && make install-dev-js)

	# pb/protos/ — commands, events, changes, snapshot
	mkdir -p "$PROTO_ROOT/pb/protos"
	cp "$HEART_DIR/pb/protos/commands.proto" "$PROTO_ROOT/pb/protos/"
	cp "$HEART_DIR/pb/protos/events.proto" "$PROTO_ROOT/pb/protos/"
	cp "$HEART_DIR/pb/protos/changes.proto" "$PROTO_ROOT/pb/protos/"
	cp "$HEART_DIR/pb/protos/snapshot.proto" "$PROTO_ROOT/pb/protos/"

	# pkg/lib/pb/model/protos/ — models, localstore
	mkdir -p "$PROTO_ROOT/pkg/lib/pb/model/protos"
	cp "$HEART_DIR/pkg/lib/pb/model/protos/models.proto" "$PROTO_ROOT/pkg/lib/pb/model/protos/"
	cp "$HEART_DIR/pkg/lib/pb/model/protos/localstore.proto" "$PROTO_ROOT/pkg/lib/pb/model/protos/"
fi

echo "Generating TypeScript protobuf bindings..."

# Clean previous generated files
rm -rf "$MIDDLEWARE_DIR/pb" "$MIDDLEWARE_DIR/pkg" "$MIDDLEWARE_DIR/google"

# Ensure middleware directory exists
mkdir -p "$MIDDLEWARE_DIR"

# Run protoc with ts-proto
protoc \
	--plugin="protoc-gen-ts_proto=$WRAPPER" \
	--ts_proto_out="$MIDDLEWARE_DIR" \
	--proto_path="$PROTO_ROOT" \
	"$PROTO_ROOT/pb/protos/commands.proto" \
	"$PROTO_ROOT/pb/protos/events.proto" \
	"$PROTO_ROOT/pb/protos/changes.proto" \
	"$PROTO_ROOT/pb/protos/snapshot.proto" \
	"$PROTO_ROOT/pkg/lib/pb/model/protos/models.proto" \
	"$PROTO_ROOT/pkg/lib/pb/model/protos/localstore.proto"

echo "Generated TypeScript files:"
find "$MIDDLEWARE_DIR/pb" "$MIDDLEWARE_DIR/pkg" "$MIDDLEWARE_DIR/google" -name '*.ts' 2>/dev/null | sort

echo "Generating service registry..."
if [[ "$FROM_DIST" == true ]]; then
	node "$ROOT_DIR/scripts/generate-service-registry.js" --from-dist
else
	node "$ROOT_DIR/scripts/generate-service-registry.js"
fi

echo "Done!"
