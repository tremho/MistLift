/** handles building in the project directory */

import * as path from 'path'
import * as fs from 'fs'
import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { recurseDirectory } from '../lib/DirectoryUtils'
import { isNewer } from '../lib/fileCompare'
import { executeCommand } from '../lib/executeCommand'
import { mkdirSync } from 'fs'

let projectPaths: any = {}

// Build command
export async function doBuildAsync (
  args: string[] // zero or more functions to build.  zero means build all
): Promise<number> {
  projectPaths = resolvePaths()
  if (projectPaths.verified !== true) {
    console.log(ac.bold.magenta('current directory is not at project root'))
    return -1
  }
  const funcsToBuild: string[] = []
  const options: string[] = []
  for (const arg of args) {
    if (arg.charAt(0) === '-') {
      options.push(arg.toLowerCase())
    } else funcsToBuild.push(arg)
  }

  if (funcsToBuild.length === 0) {
    let firstDepth = 0
    recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
      const depth = filepath.split(path.sep).length
      if (firstDepth === 0) firstDepth = depth
      if (stats.isDirectory() && depth === firstDepth) {
        funcsToBuild.push(path.basename(filepath))
      }
      return false
    })
  }

  let failFast = options.includes('--failfast')
  if (options.includes('--deferfail')) failFast = false

  let fails = 0

  for (const func of funcsToBuild) {
    const funcDir = path.join(projectPaths.functionPath, func)
    if (fs.existsSync(funcDir)) {
      fails += await buildSingleFunction(funcDir, options)
      if (fails > 0 && failFast) break
    } else {
      console.log(ac.red.bold(`${func} does not exist as a function`))
      fails++
      if (failFast) break
    }
  }
  return fails
}

// build command for a single function
async function buildSingleFunction (
  funcDir: string,
  options: string[]
): Promise<number> {
  const funcName = funcDir.substring(funcDir.lastIndexOf(path.sep) + 1)
  const buildPath = path.join(projectPaths.basePath, 'build', 'functions', funcName)

  if (options.includes('--clean')) {
    if (fs.existsSync(buildPath)) {
      fs.rmSync(buildPath, { recursive: true })
    }
  }
  // strategy here is to invoke tsc on a per-folder basis rather than letting tsc do the recurse because it is easier to control this way
  return await buildFunctionModules(funcName, funcDir, buildPath, options)
}

// build all the function modules in path
async function buildFunctionModules (
  funcName: string,
  funcDir: string,
  buildPath: string,
  options: string[]
): Promise<number> {
  const announce = ac.blue.dim(`building ${funcName}...`)
  let announced = false
  // let fails = 0
  const statObj = {
    fails: 0
  }

  let failFast = options.includes('--failfast')
  if (options.includes('--deferfail')) failFast = false
  const all: Array<Promise<void>> = []
  await recurseDirectory(funcDir, (filepath, stats) => {
    if (path.extname(filepath) === '.ts') {
      let relPath = filepath.substring(funcDir.length)
      relPath = relPath.substring(0, relPath.lastIndexOf(path.sep))
      const outDir = path.join(buildPath, relPath)

      if (!(statObj.fails > 0 && failFast)) {
        if (isNewer(filepath, outDir)) {
          if (!announced) {
            announced = true
            console.log(announce)
          }
          if (!filepath.endsWith('test.ts')) {
            all.push(buildFile(filepath, outDir, statObj))
          }
        }
      }
    }
    return false
  })
  statObj.fails += doPostBuildSteps(funcDir, buildPath)
  await Promise.all(all)
  return statObj.fails
}

async function buildFile (filepath: string, outDir: string, statObj: any): Promise<void> {
  const result: any = await executeCommand('tsc', [
    '--esModuleInterop', 'true',
    '--target', 'ES2015',
    '--module', 'commonjs',
    '--lib', 'dom,es2015,scripthost,es2015.proxy',
    '--strict', 'true',
    '--noImplicitAny', 'false',
    '--skipLibCheck', 'true',
    '--forceConsistentCasingInFileNames', 'true',
    '--sourceMap', 'true',
    '--outdir', outDir,
    filepath
  ], '', true)

  if (result.retcode !== 0) {
    if (statObj !== null && statObj !== undefined) statObj.fails++
    // console.log("error detected", fails)
    const now = new Date()
    fs.utimesSync(filepath, now, now) // touch file so it is not skipped next build
  }
}

// do the steps after the build (file copies, etc)
function doPostBuildSteps (
  funcDir: string,
  buildPath: string
): number {
  // copy the definitions,json file over
  const srcdef = path.join(funcDir, 'src', 'definition.json')
  const dstdef = path.join(buildPath, 'src', 'definition.json')
  if (fs.existsSync(srcdef)) {
    const destFolder = path.dirname(dstdef)
    if (!fs.existsSync(destFolder)) mkdirSync(destFolder, { recursive: true })
    fs.copyFileSync(srcdef, dstdef)
  } else {
    console.error(ac.red.bold('no definition file found at ' + srcdef))
    return 1
  }
  // Copy the runmain.mjs file over
  const srcrun = path.join(funcDir, 'runmain.mjs')
  const dstrun = path.join(buildPath, 'runmain.mjs')
  if (fs.existsSync(srcrun)) {
    fs.copyFileSync(srcrun, dstrun)
  }
  // copy the resources folder if it exists
  const filedirPath = path.join(funcDir, 'resources')
  if (fs.existsSync(filedirPath)) {
    const bfiles = path.join(buildPath, 'resources')
    if (!fs.existsSync(bfiles)) fs.mkdirSync(bfiles, { recursive: true })
    recurseDirectory(filedirPath, (filepath, stats) => {
      let relPath = filepath.substring(funcDir.length)
      relPath = relPath.substring(0, relPath.lastIndexOf(path.sep))
      const outDir = path.join(buildPath, relPath)
      const target = path.join(outDir, path.basename(filepath))
      if (stats.isDirectory() && !fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true })
      }
      if (stats.isFile()) {
        fs.copyFileSync(filepath, target)
      }
      return false
    })
  }
  return 0
}
