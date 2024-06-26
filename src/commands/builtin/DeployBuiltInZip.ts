
import * as path from 'path'
import { deployPackage } from '../deploy'

export async function DeployBuiltInZip
(
  name: string,
  zipPath: string
): Promise<void> {
  // console.log(">> Deploying "+name)
  await deployPackage(name, zipPath)
}

export async function DeployFileserve
(
  root: string
): Promise<void> {
  // rootName is without slash
  if (root !== '') {
    const rootName = root.replace('/', '')
    const name = 'fileserve_' + rootName
    const zipPath = path.join(__dirname, 'prebuilt-zips', 'FileServe.zip')
    await DeployBuiltInZip(name, zipPath)
  }
}
