MLDIR=`pwd`
cd ~/tbd/MistLiftBuiltIns
BIDIR=`pwd`
DEST=$MLDIR/src/commands/builtin/prebuilt-zips
# for some weird historical reason that I don't remember and don't want to figure out right now,
# the normal packaging does not work for built-in zips. We need to put it into a named folder
rm -fr $MLDIR/.bitemp
mkdir -p $MLDIR/.bitemp/API
mkdir -p $MLDIR/.bitemp/FileServe
mkdir -p $MLDIR/.bitemp/Webroot
rm -fr build MistLift_Zips
lift package API
cd $MLDIR/.bitemp/API
unzip $BIDIR/MistLift_Zips/API.zip > /dev/null 2>&1
cd $MLDIR/.bitemp
zip -r API.zip API > /dev/null 2>&1
cd $BIDIR
lift package FileServe
cd $MLDIR/.bitemp/FileServe
unzip $BIDIR/MistLift_Zips/FileServe.zip > /dev/null 2>&1
cd $MLDIR/.bitemp
zip -r FileServe.zip FileServe > /dev/null 2>&1
cd $BIDIR
lift package Webroot
cd $MLDIR/.bitemp/Webroot
unzip $BIDIR/MistLift_Zips/Webroot.zip > /dev/null 2>&1
cd $MLDIR/.bitemp
zip -r Webroot.zip Webroot > /dev/null 2>&1

rm -fr $DEST/API.zip $DEST/FileServe.zip $DEST/Webroot.zip
cp API.zip $DEST/API.zip
cp FileServe.zip $DEST/FileServe.zip
cp Webroot.zip $DEST/Webroot.zip

cd ..
rm -fr .bitemp