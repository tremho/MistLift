/** Adds necessary scripts to package.json */

import * as path from 'path'
import * as fs from 'fs'
import {executeCommand} from "../../lib/executeCommand";

/**
 * Adds necessary scripts to package.json
 */
export function addPackageScripts(
    projectPath:string
)
{
    const pkgPath = path.join(projectPath, "package.json")
    let pkgJson:any = {};
    try { pkgJson = JSON.parse(fs.readFileSync(pkgPath).toString()) } catch {}
    const script = pkgJson.script ?? {}
    script.test = "lift test"
    pkgJson.script = script;

}
export async function installPackage(
    packageName:string
)
{
    return executeCommand("npm", ["i", packageName], '', true)
}

export async function installDevPackage(
    packageName:string
)
{
    return executeCommand("npm", ["i", "--save-dev", packageName], '', true)
}