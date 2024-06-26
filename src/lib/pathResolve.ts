import path from 'path'
import fs from 'fs'

// Find the path roots in the project directory
export function resolvePaths (
): {
  basePath: string // project base
  buildPath: string // build folder
  functionPath: string // functions folder
  packagePath: string // package.json
  verified: boolean // all of these exist if true, else, may be incomplete project
} {
  const cwd = process.cwd()
  let funcPath = path.join(cwd, 'functions')
  while (true) {
    if (!fs.existsSync(funcPath)) {
      funcPath = path.normalize(path.join(funcPath, '..'))
    } else {
      const basePath = path.normalize(path.join(funcPath, '..'))
      const buildPath = path.join(basePath, 'build')
      const packagePath = path.join(basePath, 'package.json')
      const verified = fs.existsSync(basePath) && fs.existsSync(funcPath) && fs.existsSync(packagePath)
      return { basePath, buildPath, functionPath: funcPath, packagePath, verified }
    }
  }
}
