
import * as path from 'path'
import { resolvePaths } from '../pathResolve'
import { recurseDirectory } from '../DirectoryUtils'

export function GetWebrootServePaths (): string[] {
  const projectPaths = resolvePaths()
  const webroot = path.join(projectPaths.basePath, 'webroot')

  const list: string[] = ['']
  recurseDirectory(webroot, (filepath, stats) => {
    if (stats.isDirectory()) {
      let relpath = filepath.substring(webroot.length)
      if (process.platform === 'win32') while (relpath.includes(path.sep)) relpath = relpath.replace(path.sep, '/')
      if (!list.includes(relpath)) list.push(relpath)
    }
    return false
  })
  return list
}
