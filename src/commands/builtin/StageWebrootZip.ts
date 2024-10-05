import { MakePublicApiDoc } from './ApiDocMaker'

import * as path from 'path'
import * as fs from 'fs'
import { resolvePaths } from '../../lib/pathResolve'
import { recurseDirectory } from '../../lib/DirectoryUtils'
import { FolderToZip, UnzipToFolder } from '../../lib/utils'
// import { executeCommand } from '../../lib/executeCommand'
import { rmSync } from 'fs'

export async function StageWebrootZip
(
): Promise<string> {
  // console.log(">>>> staging webroot to zip")
  const projectPaths = resolvePaths()
  const webroot = path.join(projectPaths.basePath, 'webroot')
  const packageTemp = path.join(projectPaths.basePath, '.package_temp')
  const stagedWebrootFolder = path.join(packageTemp, 'Webroot')
  const zipFilesPath = path.join(stagedWebrootFolder, '__files__')
  // console.log(">>>> paths", {webroot, packageTemp, stagedWebrootFolder, zipFilesPath})
  if (fs.existsSync(stagedWebrootFolder)) rmSync(stagedWebrootFolder, { recursive: true })
  await fs.mkdirSync(stagedWebrootFolder)
  // make a public yaml
  await MakePublicApiDoc() // writes apidoc.yaml to docs
  const builtinPath = path.join(__dirname, 'prebuilt-zips', 'Webroot.zip')
  const exdir = path.join(projectPaths.basePath, '.package_temp')
  // console.log(">>>> unzipping from "+builtinPath+" to "+exdir)
  await UnzipToFolder(builtinPath, exdir)

  await rmSync(path.join(stagedWebrootFolder, 'Api.test.js'))
  await rmSync(path.join(stagedWebrootFolder, 'Api.test.js.map'))
  await rmSync(path.join(stagedWebrootFolder, 'FileServe.test.js'))
  await rmSync(path.join(stagedWebrootFolder, 'FileServe.test.js.map'))
  await rmSync(path.join(stagedWebrootFolder, 'Webroot.test.js'))
  await rmSync(path.join(stagedWebrootFolder, 'Webroot.test.js.map'))

  // console.log("is exdir "+exdir+"/Webroot the same as stagedWebrootFolder "+stagedWebrootFolder+"?")
  // console.log(">>>> Code-only webroot folder at "+stagedWebrootFolder)
  // await executeCommand('ls', [ '-l', stagedWebrootFolder], '', true)

  // console.log(">>>> making zipFilesPath "+zipFilesPath)
  await fs.mkdirSync(zipFilesPath)

  // console.log(">>>> enumerating "+webroot)
  await recurseDirectory(webroot, (filepath, stats) => {
    const relPath = filepath.substring(webroot.length)
    if (stats.isDirectory()) {
      fs.mkdirSync(zipFilesPath + relPath, { recursive: true })
    } else {
      // console.log(">>>> copying "+filepath+" to "+zipFilesPath+relPath)
      fs.copyFileSync(filepath, zipFilesPath + relPath)
    }
    return false
  })
  const webrootZip = path.join(projectPaths.basePath, 'a.zip')
  // console.log(">>>> Combined webroot folder at "+stagedWebrootFolder)
  // await executeCommand('ls', [ '-l', stagedWebrootFolder+'/__files__'], '', true)

  await FolderToZip(stagedWebrootFolder, webrootZip)
  // return path to this zip
  return webrootZip
}
