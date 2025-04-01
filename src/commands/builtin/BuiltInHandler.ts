import { StageWebrootZip } from './StageWebrootZip'
import { DeployBuiltInZip } from './DeployBuiltInZip'
import { GetWebrootServePaths } from '../../lib/openAPI/WebrootFileSupport'
import * as ac from 'ansi-colors'
import { decoratedName } from '../../lib/IdSrc'

import fs from 'fs'
import path from 'path'

export async function DeployWebrootBuiltIn
(
  externalizedFolders: boolean = true
): Promise<void> {
  // console.warn(">> DeployWebrootBuiltIn")
  // const withRoot = externalizedFolders
  // const withFolders = true
  const wrZip = await StageWebrootZip()
  const wrName = decoratedName('Webroot')
  console.log(">> Deploy Webroot Builtin from "+wrZip+" as "+wrName)

  await DeployBuiltInZip(wrName, wrZip)
  // remove temp zip when done
  // console.warn("a.zip is left behind")
  fs.rmSync(wrZip, { recursive: true })
}

export async function DeployRootFileserves
(
): Promise<void> {
  // Get root paths
  const roots = GetWebrootServePaths()
  // for each, deploy under the name of each
  const fileserveZip = path.join(__dirname, 'prebuilt-zips', 'FileServe.zip')
  const all: Array<Promise<any>> = []
  for (let root of roots) {
    root = root.trim()
    let name = decoratedName('fileserve_' + root)
    // console.log(ac.gray.dim('>> '+root+' > '+name))
    while (name.includes('/')) {
      name = name.replace('/', '')
    }
    // console.log('pushing ', {name, fileserveZip})
    all.push(DeployBuiltInZip(name, fileserveZip))
  }
  console.log(ac.green.italic(`deploying ${all.length} file groups...`))
  await Promise.all(all)
  // console.log('all complete');
}

export async function DeployApiBuiltin
(
): Promise<any> {
  // get the prebuilt zip location
  const apiZip = path.join(__dirname, 'prebuilt-zips', 'API.zip')
  await DeployBuiltInZip('api', apiZip)
}
