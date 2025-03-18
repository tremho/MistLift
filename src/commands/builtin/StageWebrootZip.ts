import { MakePublicApiDoc } from './ApiDocMaker'

import * as path from 'path'
import * as fs from 'fs'
import { resolvePaths } from '../../lib/pathResolve'
import { recurseDirectory } from '../../lib/DirectoryUtils'
import { FolderToZip, UnzipToFolder } from '../../lib/utils'
// import { executeCommand } from '../../lib/executeCommand'
import { rmSync } from 'fs'
// import * as ac from 'ansi-colors'

export async function StageWebrootZip
(
  withRoot: boolean = true,
  withFolders: boolean = true
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

  try { await rmSync(path.join(stagedWebrootFolder, 'Api.test.js')) } catch (e: any) {}
  try { await rmSync(path.join(stagedWebrootFolder, 'Api.test.js.map')) } catch (e: any) {}
  try { await rmSync(path.join(stagedWebrootFolder, 'FileServe.test.js')) } catch (e: any) {}
  try { await rmSync(path.join(stagedWebrootFolder, 'FileServe.test.js.map')) } catch (e: any) {}
  try { await rmSync(path.join(stagedWebrootFolder, 'Webroot.test.js')) } catch (e: any) {}
  try { await rmSync(path.join(stagedWebrootFolder, 'Webroot.test.js.map')) } catch (e: any) {}

  // console.log("is exdir "+exdir+"/Webroot the same as stagedWebrootFolder "+stagedWebrootFolder+"?")
  // console.log(">>>> Code-only webroot folder at "+stagedWebrootFolder)
  // await executeCommand('ls', [ '-l', stagedWebrootFolder], '', true)

  // console.log(">>>> making zipFilesPath "+zipFilesPath)
  await fs.mkdirSync(zipFilesPath)

  // todo: read the redirects.json file
  // todo: Document as deprecated
  let redirected: string[] = []
  try {
    const redir = JSON.parse(fs.readFileSync(path.join(webroot, 'redirects.json')).toString())
    redirected = Object.getOwnPropertyNames(redir)
    // console.log(ac.grey.dim('>> redirected files '), redirected)
  } catch (e: any) {
    // console.log(ac.grey.dim('>> exception reading redirects.json'), e)
  }

  // console.log(">>>> enumerating "+webroot)
  await recurseDirectory(webroot, (filepath, stats) => {
    const relPath = filepath.substring(webroot.length)
    if (stats.isDirectory() && withFolders) {
      fs.mkdirSync(zipFilesPath + relPath, { recursive: true })
    } else {
      if (
        (relPath.includes(path.sep) && withFolders) ||
         ((!relPath.includes(path.sep)) && withRoot)
      ) {
        // TODO: Deprecate redirection. we'll continue to supoort it  here, though for now
        if (!redirected.includes(relPath.substring(1))) {
          // console.log(ac.grey.dim('>> copying...'))
          fs.copyFileSync(filepath, zipFilesPath + relPath) // copy only if not in redirected list
        }
      }
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
