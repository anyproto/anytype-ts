# Anytype Desktop Client

## Installation
------------

	git clone git@github.com:anytypeio/js-anytype.git
	cd js-anytype
	npm install -D
  
## Install node addon library and protobuf bindings
### Fetch the latest binary from the [github releases](https://github.com/anytypeio/go-anytype-middleware/releases/latest)

	./update.sh <GITHUB_USER> <GITHUB_TOKEN> <macos-latest|ubuntu-latest|windows-latest>
	
### Or compile from the source code

Follow instructions at [go-anytype-middleware](https://github.com/anytypeio/go-anytype-middleware#how-to-build)

## Run the local dev-server
------------

### MacOS, Linux
	SERVER_PORT=<PORT> ANYPROF=:<PROFILER_PORT> npm run start:dev

### Windows
	SERVER_PORT=<PORT> ANYPROF=:<PROFILER_PORT> npm run start:dev-win
	
### NPM env vars	
	- SERVER_PORT - local server port
	
### GO env vars
	- ANYPROF - profiler port, access http://localhost:<PORT>/debug/pprof/profile?seconds=30 for profiling
  
## Build
------------

	npm run dist:(mac|win|linux)
	
### NPM env vars	
	- ELECTRON_SKIP_NOTARIZE=1 - skip MacOS notarization process
