cd ./electron/pipe/ && node-gyp configure && node-gyp build
cd ../../
rm -rf ./build
mv ./electron/pipe/build ./build