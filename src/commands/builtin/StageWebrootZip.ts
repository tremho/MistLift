import { MakePublicApiDoc } from './ApiDocMaker'

import * as path from 'path'
import * as fs from 'fs'
import { resolvePaths } from '../../lib/pathResolve'
import { recurseDirectory } from '../../lib/DirectoryUtils'
import { FolderToZip, UnzipToFolder } from '../../lib/utils'

export async function StageWebrootZip
(
): Promise<string> {
  // console.log(">> staging webroot to zip")
  const projectPaths = resolvePaths()
  // make a public yaml
  await MakePublicApiDoc() // writes apidoc.yaml to docs
  const builtinPath = path.join(__dirname, 'prebuilt-zips', 'Webroot.zip')
  const exdir = path.join(projectPaths.basePath, '.package_temp')
  await UnzipToFolder(builtinPath, exdir)
  const webroot = path.join(projectPaths.basePath, 'webroot')
  const packageTemp = path.join(projectPaths.basePath, '.package_temp')
  const zipFilesPath = path.join(packageTemp, 'Webroot', '__files__')
  await fs.mkdirSync(zipFilesPath, { recursive: true })
  await recurseDirectory(webroot, (filepath, stats) => {
    const relPath = filepath.substring(webroot.length)
    if (stats.isDirectory()) {
      fs.mkdirSync(zipFilesPath + relPath, { recursive: true })
    } else {
      fs.copyFileSync(filepath, zipFilesPath + relPath)
    }
    return false
  })
  const webrootZip = path.join(projectPaths.basePath, 'a.zip')

  await FolderToZip(path.join(packageTemp, 'Webroot'), webrootZip)
  // return path to this zip
  return webrootZip
}
