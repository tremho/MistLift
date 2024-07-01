/** Handles fucntion creation via the create command */

import * as fs from 'fs'
import * as path from 'path'
import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { camelCase } from '../lib/CaseUtils'
import { helpCreate } from './help'

/// Create command
export function doCreate (
  funcName?: string // name of function to create
): void {
  if (funcName === '' || funcName === undefined) {
    helpCreate()
  } else {
    console.log(ac.green.bold('Creating new function named ') + funcName)

    const projectPaths = resolvePaths()
    if (!projectPaths.verified) {
      console.log(ac.bold.magenta('current directory is not at project root'))
      return
    }
    const funcPath = path.join(projectPaths.functionPath, funcName)
    if (!fs.existsSync(funcPath)) fs.mkdirSync(funcPath)
    const dataDir = path.join(__dirname, '..', '..', 'templateData')

    const testdirname = camelCase(funcName) + '-tests'
    if (!fs.existsSync(path.join(funcPath, testdirname))) fs.mkdirSync(path.join(funcPath, testdirname))
    if (!fs.existsSync(path.join(funcPath, 'src'))) fs.mkdirSync(path.join(funcPath, 'src'))

    let localsrc = fs.readFileSync(path.join(dataDir, 'function-local-ts')).toString()
    while (localsrc.includes('$$FUNCTION_NAME$$')) {
      localsrc = localsrc.replace('$$FUNCTION_NAME$$', funcName)
    }
    fs.writeFileSync(path.join(funcPath, 'src', 'local.ts'), localsrc)
    let defsrc = fs.readFileSync(path.join(dataDir, 'function-definition-template')).toString()
    while (defsrc.includes('$$FUNCTION_NAME$$')) {
      defsrc = defsrc.replace('$$FUNCTION_NAME$$', funcName)
    }
    const defpathMap = '/' + funcName.toLowerCase()
    defsrc = defsrc.replace('$$PATHMAP$$', defpathMap)
    fs.writeFileSync(path.join(funcPath, 'src', 'definition.json'), defsrc)
    let mainsrc = fs.readFileSync(path.join(dataDir, 'function-main-ts')).toString()
    while (mainsrc.includes('$$TemplateName$$')) {
      mainsrc = mainsrc.replace('$$TemplateName$$', funcName)
    }
    fs.writeFileSync(path.join(funcPath, 'src', 'main.ts'), mainsrc)
    fs.copyFileSync(path.join(dataDir, 'function-test-template'), path.join(funcPath, testdirname, 'Sanity.test.ts'))
    fs.copyFileSync(path.join(dataDir, 'function-runmain-mjs'), path.join(funcPath, 'runmain.mjs'))
  }
}
