
import path from 'path'
import fs, { Stats } from 'fs'
import { resolvePaths } from '../lib/pathResolve'

import * as ac from 'ansi-colors'

import { recurseDirectory } from '../lib/DirectoryUtils'
import { getLiftVersion, getProjectName, getProjectVersion } from '../lib/LiftVersion'
import { executeCommand } from '../lib/executeCommand'
import { isNewerFile } from '../lib/fileCompare'
import { doBuildAsync } from './build'
import { FolderToZip } from '../lib/utils'

// test then package
export async function doPackageAsync (
  args: string[]
): Promise<number> {
  const projectPaths = resolvePaths()
  if (!projectPaths.verified) {
    console.log(ac.bold.magenta('current directory is not at project root'))
    return -1
  }
  const workPath = path.join(projectPaths.basePath, '.package_temp')

  if (fs.existsSync(workPath)) fs.rmSync(workPath, { recursive: true })
  fs.mkdirSync(workPath)

  const buildFunctionsPath = path.join(projectPaths.buildPath, 'functions')

  const funcsToPackage: string[] = []
  const options: string[] = []
  for (const arg of args) {
    if (arg.charAt(0) === '-') {
      options.push(arg.toLowerCase())
    } else funcsToPackage.push(arg)
  }

  const ret = await doBuildAsync(args)
  if (ret !== 0) return ret

  if (funcsToPackage.length === 0) {
    let firstDepth = 0
    recurseDirectory(buildFunctionsPath, (filepath, stats) => {
      const depth = filepath.split(path.sep).length
      if (firstDepth === 0) firstDepth = depth
      if (stats.isDirectory() && depth === firstDepth) {
        funcsToPackage.push(path.basename(filepath))
      }
      return false
    })
  }

  let error = 0

  const recurse = async (i: number): Promise<any> => {
    if (i >= funcsToPackage.length) return
    const funcName = funcsToPackage[i]
    const pe = await packageFunction(funcName)
    if (pe !== 0) {
      error = pe
      return error
    }
    await recurse(++i)
  }
  await recurse(0)
  return error
}

async function packageFunction (funcName: string): Promise<number> {
  const projectPaths = resolvePaths()
  const buildFunctionsPath = path.join(projectPaths.buildPath, 'functions')
  const all: Array<Promise<any>> = []
  const error = 0
  const funcPath = path.join(buildFunctionsPath, funcName)
  if (!fs.existsSync(funcPath)) {
    console.error(ac.red.bold(`${funcName} does not exist`) + ', cannot package')
    return -1
  }
  const zipdir = path.join(projectPaths.basePath, 'MistLift_Zips')
  const zipFile = path.join(zipdir, funcName + '.zip')

  if (!fs.existsSync(zipdir)) {
    fs.mkdirSync(zipdir)
  }
  const zfx = fs.existsSync(zipFile)
  if (zfx) {
    if (!isNewerFile(funcPath, zipFile, '.js', '.zip')) {
      return 0
    }
    fs.unlinkSync(zipFile)
  }

  const projectName = getProjectName() ?? ''
  const projectVersion = getProjectVersion()?.toString() ?? ''
  const liftVersion = getLiftVersion()?.toString() ?? ''

  // the main package json that has all imports
  const mainPkgJsonPath = path.join(projectPaths.packagePath)
  const mainPkgSrc = fs.readFileSync(mainPkgJsonPath).toString()
  const mainPkgJson = JSON.parse(mainPkgSrc)
  const workPath = path.join(projectPaths.basePath, '.package_temp')

  console.log(ac.green.italic('packaging ') + ac.green.bold(funcName))

  // make a nominal package.json
  const pkgjson = {
    name: funcName,
    description: 'Lambda function ' + funcName + ' for ' + projectName + ', created with MistLift ' + liftVersion,
    version: projectVersion,
    main: 'runmain.mjs',
    scripts: {
      test: 'echo "No Tests Defined" && exit 1'
    },
    dependencies: {},
    keywords: [],
    author: '',
    license: 'MIT'
  }
  // find all the imports in the sources
  const imports = findAllImports(funcPath)
  pkgjson.dependencies = reconcileVersionImports(imports, mainPkgJson)
  //  - write out new package.json to workPath
  // console.log("writing package.json", pkgjson)
  fs.writeFileSync(path.join(workPath, 'package.json'), JSON.stringify(pkgjson, null, 2))
  //  - execute npm i at workpath, create node_modules
  await executeCommand('npm i', [], workPath).then(() => {
    // copy the lambda function
    recurseDirectory(funcPath, (filepath: string, stats: Stats) => {
      if (filepath.substring(0, funcPath.length) === funcPath) {
        const endpath = filepath.substring(funcPath.length)
        if (!endpath.toLowerCase().includes(`${funcName}-tests`.toLowerCase())) { // skip tests
          const fromPath = path.join(funcPath, endpath)
          const toPath = path.join(workPath, endpath)
          if (stats.isDirectory() && !fs.existsSync(toPath)) {
            fs.mkdirSync(toPath)
          }
          if (stats.isFile()) {
            fs.copyFileSync(fromPath, toPath)
          }
        }
      }
      return false
    })

    // put a runmain.mjs into place
    const templatePath = path.join(__dirname, '..', '..', 'templateData', 'function-runmain-mjs')
    const runmainPath = path.join(workPath, 'runmain.mjs')
    fs.writeFileSync(runmainPath, fs.readFileSync(templatePath))

    all.push(FolderToZip(workPath, zipFile))
    // console.log("now zip it")
  })

  return await Promise.all(all).then(() => {
    return error
  })
}

function findAllImports (folder: string): string[] {
  const imports: string[] = []
  if (fs.existsSync(folder)) {
    recurseDirectory(folder, (filepath, stats) => {
      // console.log(`filepath = ${filepath}`);
      if (!filepath.includes('__files__')) {
        if (!stats.isDirectory()) {
          const content = fs.readFileSync(filepath).toString()
          for (const m of findImports(content)) {
            // console.log('  import', m)
            imports.push(m)
          }
        }
      }
      return false
    })
  }
  return imports
}

function findImports (content: string): string[] {
  const imports: string[] = []
  const regexp = /require\s*\(\s*["|'](.+)["|']/gm
  const matches = content.matchAll(regexp)
  for (const m of matches) {
    imports.push(m[1])
  }
  return imports
}

function reconcileVersionImports (
  imports: string[],
  mainPkgJson: any
): any {
  const dependencies = mainPkgJson.dependencies ?? {}
  const devDependencies = mainPkgJson.devDependencies ?? {}

  const builtins = [
    'fs',
    'path',
    'process',
    'crypto',
    'http'
  ]

  const depsOut: any = {}

  for (const m of imports) {
    let isDev = false
    let r: string | undefined = dependencies[m]
    if (r === undefined) {
      isDev = true
      r = devDependencies[m]
    }
    if (r !== undefined) {
      if (depsOut[m] !== undefined && depsOut[m] !== r) {
        console.error(ac.red.bold(`  Version mismatch on ${m}: ${r} vs ${depsOut[m] as string}`))
      }
      if (isDev) {
        console.error(ac.magenta(`  ${m} import is dev-only, not migrated`))
      } else {
        if (depsOut[m] !== undefined) console.log(ac.blue.dim(`  ${m} exported as ${r}`))
        depsOut[m] = r
      }
    } else {
      // if not a builtin and not local..
      if (!builtins.includes(m)) {
        if (m.charAt(0) !== '.') {
          console.error(ac.red.bold('  ERROR - Found no dependency reference for import'), m)
        }
      }
    }
  }
  return depsOut
}
