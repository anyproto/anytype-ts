cd ./electron/addon/ && node-gyp configure && node-gyp build
cd ../../
rm -rf ./build
mv ./electron/addon/build ./build