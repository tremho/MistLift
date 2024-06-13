
import * as path from 'path'
import {deployPackage} from '../deploy'

export async function DeployBuiltInZip
(
    name:string,
    zipPath:string
)
{
    await deployPackage(name, zipPath);
}

export async function DeployFileserve
(
    root:string
)
{
    // rootName is without slash
    let rootName = root.replace("/", "")
    let name = "fileserve_"+rootName
    let zipPath = path.join(__dirname, 'prebuilt-zips', 'FileServe.zip')
    await DeployBuiltInZip(name, zipPath)
}
