import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { DeployRootFileserves } from './builtin/BuiltInHandler'
import { esbuilder } from '../lib/ESBuild'

/// Info command
export async function doUpdateAsync (
  stageName?: string
): Promise<number> {
  const projectPaths = resolvePaths()

  if (!projectPaths.verified) {
    console.log(ac.bold.magenta('current directory is not at project root'))
    return -1
  }

  if (stageName === undefined) stageName = 'Dev'
  console.log(ac.green.bold(`Updating Webroot files to ${stageName}`))

  try {
    await esbuilder()
    await DeployRootFileserves()
    return 0
  } catch (e: any) {
    console.log(ac.bold.red('Unexpected failure updating Webroot deployments'))
    return -1
  }
}
