import {StageWebrootZip} from "./StageWebrootZip";
import {DeployBuiltInZip} from "./DeployBuiltInZip";
import {GetWebrootServePaths} from "../../lib/openAPI/WebrootFileSupport";

import fs from 'fs'
import path from 'path'


export async function DeployWebrootBuiltIn
(
)
{
    const wrZip = await StageWebrootZip()
    // console.log("Deploy Webroot Builtin from "+wrZip)
    await DeployBuiltInZip("Webroot", wrZip)
    // remove temp zip when done
    fs.rmSync(wrZip, {recursive: true});
}

export async function DeployRootFileserves
(
)
{
    // console.log("Deploy Root Fileserves")
    // Get root paths
    const roots = GetWebrootServePaths();
    // for each, deploy under the name of each
    const fileserveZip = path.join(__dirname, 'prebuilt-zips', 'FileServe.zip')
    let all:Promise<any>[] = [];
    for(let root of roots) {
        root = root.trim()
        let name = "fileserve_" + root;
        while (name.indexOf("/") !== -1) {
            name = name.replace('/', '');
        }
        all.push(DeployBuiltInZip(name, fileserveZip))
    }
    // console.log('wait all');
    await Promise.all(all);
    // console.log('all complete');
}

export async function DeployApiBuiltin
(
):Promise<any>
{
    console.log("Deploy API Builtin")
    // get the prebuilt zip location
    const apiZip = path.join(__dirname, 'prebuilt-zips', 'API.zip')
    await DeployBuiltInZip("api", apiZip)
}
