MLDIR=`pwd`
cd ~/tbd/MistLiftBuiltIns
BIDIR=`pwd`
DEST=$MLDIR/src/commands/builtin/prebuilt-zips
rm -fr build MistLift_Zips
lift package

# Webroot is weird in that it is not at root like normal
cd $BIDIR
echo "bundling webroot in subfolder (historical oddity)"
mkdir -p $MLDIR/.bitemp/Webroot
cd $MLDIR/.bitemp/Webroot
echo "unzipping..."
unzip -o $BIDIR/MistLift_Zips/Webroot.zip  > /dev/null 2>&1
cd ..
echo "rezipping..."
zip -r Webroot.zip Webroot > /dev/null 2>&1

echo "transferring into place"

rm -fr $DEST/API.zip $DEST/FileServe.zip $DEST/Webroot.zip
cd $BIDIR/MistLift_Zips
cp API.zip $DEST/API.zip
cp FileServe.zip $DEST/FileServe.zip
cp $MLDIR/.bitemp/Webroot.zip $DEST/Webroot.zip

cd $MLDIR
rm -fr .bitemp
