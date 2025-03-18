import * as path from 'path'
import * as fs from 'fs'
import * as ac from 'ansi-colors'
import { resolvePaths } from '../../lib/pathResolve'
import { recurseDirectory } from '../../lib/DirectoryUtils'
import { isNewer } from '../../lib/fileCompare'
import { executeCommand } from '../../lib/executeCommand'
import { mkdirSync } from 'fs'
import { DeployRootFileserves, DeployWebrootBuiltIn } from './BuiltInHandler'
import { ServiceSettingsData } from '@tremho/inverse-y'
import { exportWebrootToS3, getS3Prefix } from './webroot-export/s3webroot'

/*
Here we want to handle exporting the webroot to other serving sources according to configuration.

- Read the config  options
- enumerate the webroot and find recent changes
- write these file paths to a temp file
- per config, call the handler that will do this
    - to S3
    - to script
    later:
    - to Blob ?
    -

 */

/*
Script will be called with comma delimited list of files as arg 1, and options (string) as arg2
 */
export class WebrootScriptOptions {
  public scriptName = '' // name of script to call (relative to project root)
  public options = '' // options passed as second parameter to script (see comment above)
}
export class WebrootS3Options {
}
export class WebrootDefaultOptions {
}

export type WebrootOptions = WebrootDefaultOptions | WebrootScriptOptions | WebrootS3Options

/*
For non-SELF types, only the files *not* in subdirectories will be packaged to the deployed webroot
 */
export enum WebrootExportType {
  SELF = 'SELF', // Webroot is packaged and deployed per existing implementation, including all subdirectories
  SCRIPT = 'SCRIPT', // a build-time script is called to copy all updated files to their target
  S3 = 'S3' // built-in function (instead of script) is called for an S3 target
}

/*
This is what webrootConfig.json looks like
 */
export class WebrootExportConfig {
  public type: WebrootExportType = WebrootExportType.SELF
  public options: WebrootOptions = new WebrootDefaultOptions()
}

let basePath = ''

/**
 * Exports the webroot according to configuration
 */
export async function ExportWebroot () {
  const projectPaths = resolvePaths()
  basePath = projectPaths.basePath
  const webrootConfig = readWebrootConfig(path.join(basePath, 'webrootConfig.json'))
  // console.log(">> ExportWebroot", {webrootConfig})

  const fla = await getUpdatedExportFileList()
  switch (webrootConfig.type) {
    case WebrootExportType.SELF:
      await exportSelf()
      break
    case WebrootExportType.S3:
      await exportWebrootToS3(fla, webrootConfig.options as WebrootS3Options)
      break
    case WebrootExportType.SCRIPT:
      await exportScript(fla, webrootConfig.options as WebrootScriptOptions)
      break
    default:
      throw new Error('UNSUPPORTED WEBROOT EXPORT ' + webrootConfig.type)
  }
}
export async function getWebrootSettings () {
  const projectPaths = resolvePaths()
  basePath = projectPaths.basePath
  const webrootConfig = readWebrootConfig(path.join(basePath, 'webrootConfig.json'))
  let baseUrl = ''
  switch (webrootConfig.type) {
    case WebrootExportType.SELF:
      baseUrl = ''
      break
    case WebrootExportType.S3:
      baseUrl = await getS3Prefix()
      break
    case WebrootExportType.SCRIPT:
      const options = webrootConfig.options as WebrootScriptOptions
      const scriptPath = path.join(basePath, options.scriptName)
      const out = await executeCommand(scriptPath, ['--prefix'], basePath, false)
      baseUrl = out.stdStr.trim()
      break
    default:
      throw new Error('UNSUPPORTED WEBROOT EXPORT ' + webrootConfig.type)
  }
  return {
    webrootMethod: webrootConfig.type.toString(),
    webrootBaseUrl: baseUrl
  }
}

function readWebrootConfig (configPath: string): WebrootExportConfig {
  let conf = new WebrootExportConfig()
  let content = ''
  // console.log("... reading from "+configPath)
  try {
    // console.log("  >> readWebrootConfig")
    content = fs.readFileSync(configPath).toString()
    conf = JSON.parse(content)
  } catch (e: any) {
    console.error(ac.red.bold('Error: Failed to read or parse ' + configPath))
    console.warn(ac.yellow.bold.dim("Falling back to 'self' publish mode"))
  }

  return conf
}

async function exportSelf () {
  // zip up everything
  // console.log(">> exportSelf")
  // console.log("  >> deployWebrootBuiltIn")
  await DeployWebrootBuiltIn(false)
  // console.log("  >> deployRootFileserves")
  await DeployRootFileserves()
}

async function exportScript (fla: string[], options: WebrootScriptOptions) {
  // console.log(">> exportScript")
  // console.log("  >> DeployWebrootBuiltIn")
  // await DeployWebrootBuiltIn(true)
  console.log(ac.bold.green(`calling webroot exportScript ${options.scriptName}`))
  // console.log("files", fla)
  const fl = fla.join(',')
  const args = [fl]
  // args.unshift(options.options)
  // console.log("args", args)

  const scriptPath = path.join(basePath, options.scriptName)
  // console.log("Executing script", scriptPath)
  await executeCommand(scriptPath, args, basePath, true)
}

async function getUpdatedExportFileList (): Promise<string[]> {
  // console.log(">> getUpdatedExportFileList")
  // find the last published time from .published file
  let lastPublished = 0
  try {
    const pubjson = JSON.parse(fs.readFileSync(path.join(basePath, '.published')).toString())
    lastPublished = pubjson.time
    // console.log("last published ", lastPublished)
  } catch (e: any) {
    console.warn(ac.yellow.italic.dim('no .published information available - full export'))
  }
  const outbin: string[] = []
  // enumerate at webroot and files from all non-root directories
  const folder = path.join(basePath, 'webroot')
  const rootpathsteps = folder.split(path.sep).length
  const enumerating = true

  function gatherFiles (filepath: string, stats: fs.Stats): boolean {
    // console.log(filepath, {steps:filepath.split(path.sep).length, rootpathsteps, isDir:stats.isDirectory()})
    if (filepath.split(path.sep).length > rootpathsteps + 1) {
      // console.log({filepath, mtime:stats.mtime.getTime(), lastPublished})
      if (stats.mtime.getTime() >= lastPublished) {
        filepath = '+' + filepath
        // console.log("will update "+filepath)
      }
      outbin.push(filepath)
    }
    return false
  }
  // console.log("recursing folder ", folder)
  await recurseDirectory(folder, gatherFiles)
  return outbin
}
