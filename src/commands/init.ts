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
  clientType?: string,
  defaults?: boolean
): Promise<void> {
  if (folder === undefined || folder === '') {
    helpInit()
    return
  }
  if (clientType?.length === 0) clientType = 'js'
  if (clientType?.toLowerCase() !== 'react' && clientType?.toLowerCase() !== 'js') {
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

    localConfig(clientType, refPath)

    if (clientType === 'react') {
      const appPath = path.join(refPath, 'app')
      const appSrc = path.join(swaggerSrcDir, 'app')
      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath)
        fs.copyFileSync(path.join(appSrc, 'app.tsx'), path.join(appPath, 'app.tsx'))
        fs.copyFileSync(path.join(appSrc, 'MainPage.tsx'), path.join(appPath, 'MainPage.tsx'))
      }
    }

    await interrogateUserForPackageJsonSettings(refPath, defaults)
    await addPackageScripts(refPath)
    if (clientType === 'react') {
      await installPackage(refPath, 'react')
      await installPackage(refPath, 'react-dom')
      await installPackage(refPath, 'react-router-dom')
      await installDevPackage(refPath, '@types/react')
    }
    await installDevPackage(refPath, '@types/node')
    await installDevPackage(refPath, 'typescript')
    await installDevPackage(refPath, 'tap')
    await installDevPackage(refPath, '@tremho/tap-assert')
    await installPackage(refPath, '@tremho/inverse-y')
  }

  function localConfig (clientType: string, refpath: string): void {
    const config: any = {
      port: 8081,
      rebuildFunctionsOnChange: false,
      refreshBrowserOnFunctionChange: false,
      refreshBrowserOnWebrootChange: false
    }
    if (clientType === 'react') {
      config.esbuild = {
        watch: false,
        entryPoints: [
          'app/app.tsx'
        ],
        outdir: 'webroot'
      }
    }

    const content = JSON.stringify(config, null, 2)
    fs.writeFileSync(path.join(refpath, 'localServerConfig.json'), content)
  }
}
