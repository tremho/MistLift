/** Handles fucntion creation via the create command */

import * as fs from 'fs'
import * as path from 'path'
import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { pascalCase } from '../lib/CaseUtils'
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

    const testFileName = pascalCase(funcName) + '.test.ts'
    if (!fs.existsSync(path.join(funcPath, 'src'))) fs.mkdirSync(path.join(funcPath, 'src'))

    // create link to common lib
    if (!fs.existsSync(path.join(funcPath, 'src', 'commonLib'))) {
      const funcSrc = path.join(funcPath, 'src')
      const relPath = path.relative(funcSrc, projectPaths.basePath)
      let from = path.join(relPath, 'commonLib')
      let to = path.join(funcSrc, 'lib')
      if (path.sep !== '/') {
        while (from.includes('/')) from = from.replace('/', path.sep)
        while (to.includes('/')) to = to.replace('/', path.sep)
      }

      fs.symlinkSync(from, to, 'dir')
    }

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
    fs.copyFileSync(path.join(dataDir, 'function-test-template'), path.join(funcPath, testFileName))
    fs.copyFileSync(path.join(dataDir, 'function-runmain-mjs'), path.join(funcPath, 'runmain.mjs'))
  }
}
