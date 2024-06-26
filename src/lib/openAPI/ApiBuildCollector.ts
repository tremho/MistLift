/**
 * Part 1 of two steps to build openApi docs.
 * This reads values from our "definitions.json" format and creates a single array that step 2 will turn into
 * openApi specifications.
 */
import fs from 'fs'
import path from 'path'
import { recurseDirectory } from '../DirectoryUtils'
import { resolvePaths } from '../pathResolve'

export function gatherFunctionDefinitions (): any[] {
  const defs: any = []
  try {
    const projectPaths = resolvePaths()
    if (!projectPaths.verified) return []
    const funcNames: string[] = []
    if (!fs.existsSync(projectPaths.functionPath)) return []
    let firstDepth = 0
    recurseDirectory(projectPaths.functionPath, (filepath, stats) => {
      if (stats.isDirectory()) {
        const depth = filepath.split(path.sep).length
        if (firstDepth === 0) firstDepth = depth
        if (firstDepth === depth) {
          funcNames.push(path.basename(filepath))
        }
      }
      return false
    })
    if (projectPaths.functionPath.includes('functions')) {
      for (const name of funcNames) {
        const defPath = path.join(projectPaths.functionPath, name, 'src', 'definition.json')
        if (fs.existsSync(defPath)) {
          const content = fs.readFileSync(defPath).toString()
          // const buildPath = path.join(projectPaths.buildPath, 'functions', name, 'src', 'definition.json')
          // fs.writeFileSync(buildPath, content); // use this opportunity to copy to build folder before we use it.
          defs.push(JSON.parse(content))
        } else {
          console.error(`Definition file not found at ${defPath}`)
          return []
        }
      }
    }
  } catch (e: any) {
    console.error('Exception in ApiBuildCollector', e)
  }
  return defs
}
