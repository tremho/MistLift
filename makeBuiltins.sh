MLDIR=`pwd`
cd ~/tbd/MistLiftBuiltIns
rm -fr build MistLift_Zips
lift build
cp runmain.mjs build/API
cp runmain.mjs build/FileServe
cp runmain.mjs build/Webroot
lift package

DEST=$MLDIR/src/commands/builtin/prebuilt-zips

rm -fr $DEST/API.zip $DEST/FileServe.zip $DEST/Webroot.zip
cp MistLift_Zips/API.zip $DEST/API.zip
cp MistLift_Zips/FileServe.zip $DEST/FileServe.zip
cp MistLift_Zips/Webroot.zip $DEST/Webroot.zip

