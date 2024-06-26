
import * as path from 'path'
import { resolvePaths } from '../pathResolve'
import { recurseDirectory } from '../DirectoryUtils'

export function GetWebrootServePaths (): string[] {
  const projectPaths = resolvePaths()
  const webroot = path.join(projectPaths.basePath, 'webroot')

  const list: string[] = ['']
  recurseDirectory(webroot, (filepath, stats) => {
    if (stats.isDirectory()) {
      const relpath = filepath.substring(webroot.length)
      if (!list.includes(relpath)) list.push(relpath)
    }
    return false
  })
  return list
}
