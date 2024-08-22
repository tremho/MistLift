/** Handles the init command to set up a new project space
 *
 * necessary inputs:
 * - path to project folder
 *
 * create folder if not exist
 * populate with directory structure
 * build
 * functions
 * tsccoinfig
 * package.json
 *
 * npm i
 * npm run build
 */

import * as path from 'path'
import * as fs from 'fs'
import { helpInit } from './help'
import { interrogateUserForPackageJsonSettings } from './actions/initQuestions'
import { addPackageScripts, installPackage, installDevPackage } from './actions/setupPackageJson'

export async function doInit (
  folder?: string,
  defaults?: boolean
): Promise<void> {
  if (folder === undefined || folder === '') {
    helpInit()
    return
  }
  const cwd = process.cwd()
  const refPath = path.isAbsolute(folder) ? path.normalize(folder) : path.normalize(path.join(cwd, folder))
  if (!fs.existsSync(refPath)) {
    fs.mkdirSync(refPath, { recursive: true })
  }

  const funcDir = path.join(refPath, 'functions')
  if (!fs.existsSync(funcDir)) {
    fs.mkdirSync(funcDir)
  }

  const libDir = path.join(refPath, 'commonLib')
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir)
  }

  // make webroot with docs folder and placeholder yaml
  const webroot = path.join(refPath, 'webroot')
  const webrootDocs = path.join(webroot, 'docs')
  if (!fs.existsSync(webrootDocs)) {
    fs.mkdirSync(webrootDocs, { recursive: true })
    const yaml = path.join(webrootDocs, 'apidoc.yaml')
    fs.writeFileSync(yaml, '')
    const swaggerSrcDir = path.join(__dirname, '..', '..', 'templateData')
    fs.copyFileSync(path.join(swaggerSrcDir, 'swagger-ui.css'), path.join(webrootDocs, 'swagger-ui.css'))
    fs.copyFileSync(path.join(swaggerSrcDir, 'swagger-ui-bundle.js'), path.join(webrootDocs, 'swagger-ui-bundle.js'))
    fs.copyFileSync(path.join(swaggerSrcDir, 'swagger-ui-standalone-preset.js'), path.join(webrootDocs, 'swagger-ui-standalone-preset.js'))

    const webrootSrcDir = path.join(swaggerSrcDir, 'webroot')
    fs.copyFileSync(path.join(webrootSrcDir, 'index.html'), path.join(webroot, 'index.html'))
    fs.copyFileSync(path.join(webrootSrcDir, 'app.js'), path.join(webroot, 'app.js'))
    fs.copyFileSync(path.join(webrootSrcDir, 'app.css'), path.join(webroot, 'app.css'))
    fs.copyFileSync(path.join(webrootSrcDir, 'watcher.js'), path.join(webroot, 'watcher.js'))

    fs.copyFileSync(path.join(swaggerSrcDir, 'localServerConfig.json'), path.join(refPath, 'localServerConfig.json'))
  }

  await interrogateUserForPackageJsonSettings(refPath, defaults)
  await addPackageScripts(refPath)
  await installDevPackage(refPath, '@types/node')
  await installDevPackage(refPath, 'typescript')
  await installDevPackage(refPath, 'tap')
  await installDevPackage(refPath, '@tremho/tap-assert')
  await installPackage(refPath, '@tremho/inverse-y')
}
