import path from "path";
import fs from "fs";
import {recurseDirectory} from "./DirectoryUtils";

// true if filepath > mapped file in outDir (i.e. .ts > .js)
export function isNewer(filepath:string, outDir:string, mappingObj:any = {".ts": ".js"})
{
    let basename = path.basename(filepath);
    let ext = path.extname(filepath)
    basename = basename.substring(0, basename.lastIndexOf(ext));
    let newExt = "";

    if(mappingObj[ext]) newExt = mappingObj[ext];

    let outfile = path.join(outDir, basename+newExt);
    return isNewerFile(filepath, outfile);
}

// true if filepath is newer than destpath
export function isNewerFile(filepath:string, destpath:string, srcFilter:string = "", dstFilter:string = "")
{
    const sstat = fs.statSync(filepath);
    const srcTime = sstat.isDirectory() ? latestInDirectory(filepath, srcFilter) : fs.statSync(filepath).mtime;
    let destTime = new Date(0);
    if(fs.existsSync((destpath))) {
        const dstat = fs.statSync(destpath);
        destTime = dstat.isDirectory() ? latestInDirectory(destpath, dstFilter) : fs.statSync(destpath).mtime;
    }
    return (srcTime >= destTime)
}
function latestInDirectory(dirPath:string, extFilter:string = "")
{
    let newestTime = new Date(0);
    recurseDirectory(dirPath, (filepath, stats) => {
        if(stats.isFile()) {
            const ext = path.extname(filepath);
            if(!extFilter || ext === extFilter) {
                if(stats.mtime > newestTime) {
                    newestTime = stats.mtime
                }
            }
        }
    })
    return newestTime;

}