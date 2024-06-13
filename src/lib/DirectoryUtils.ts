
import fs from 'fs';
import {Stats} from 'fs'
import path from 'path'

// Callback definition for recurseDirectory
export interface RecurseCB {
    (filepath: string, stats: Stats): boolean|void;
}

// Recurse a directory, calling back to a 'for-each' callback for all files in tree
export function recurseDirectory(dirpath:string, callback:RecurseCB) {
    fs.readdirSync(dirpath).forEach((file:string) => {
        const fpath = path.join(dirpath, file)
        const stat = fs.lstatSync(fpath)
        if(callback && !callback(fpath, stat)) {
            if (stat.isDirectory()) {
                recurseDirectory(fpath, callback)
            }
        }
    })
}

// find the latest mod time for matching files in this folder tree
export function latestModification(dirpath:string, match:string) {
    let latestTime = new Date(0);
    if(fs.existsSync(dirpath)) {
        recurseDirectory(dirpath, (filepath: string, stats: Stats) => {
            let basefile = filepath.substring(filepath.lastIndexOf('/') + 1)
            if (basefile.match(match)) {
                if (stats.mtime > latestTime) latestTime = stats.mtime
            }
        })
    }
    return latestTime
}