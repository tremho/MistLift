import {executeCommand} from "./executeCommand";
import * as ac from "ansi-colors";
import * as fs from 'fs'

/** General utilities */

const zipDir = require('zip-dir')

// pause the given number of milliseconds
export async function delay(
    ms:number // milliseconds to delay
)
{
    return new Promise(resolve => {setTimeout(resolve, ms)})
}

export async function FolderToZip(
    folderPath:string,
    zipPath: string
):Promise<Uint8Array>
{
    return new Promise(resolve => {
        zipDir(folderPath, { saveTo: zipPath }, function (err:any, buffer:Uint8Array) {
            if(err) throw err
            // `buffer` is the buffer of the zipped file
            // And the buffer was saved to `~/myzip.zip`
            resolve(buffer);
        })
    })
}
export async function UnzipToFolder(
    zipPath:string,
    folderPath:string,
    replace:boolean = true
)
{
    // TODO: using CLI -- find a good package. "unzip" has vulnerabilities. Try others.

    if(replace) fs.rmSync(folderPath, {recursive: true, force: true})
    let result = await executeCommand('unzip', [zipPath,'-d', folderPath])
    if (result.retcode) {
        console.error(ac.red.bold(`failed to stage webroot (${result.retcode}): ${result.errStr}`));
        throw Error();
    }
}