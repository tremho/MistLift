import * as ac from 'ansi-colors'
import { resolvePaths } from '../lib/pathResolve'
import { DeployRootFileserves, DeployWebrootBuiltIn } from './builtin/BuiltInHandler'
import { esbuilder } from '../lib/ESBuild'

/// Info command
export async function doUpdateAsync (
  stageName?: string
): Promise<number> {
  const projectPaths = resolvePaths()

  // console.warn('>>> Update')

  if (!projectPaths.verified) {
    console.log(ac.bold.magenta('current directory is not at project root'))
    return -1
  }

  if (stageName === undefined) stageName = 'Dev'
  console.log(ac.green.bold(`Updating Webroot files to ${stageName}`))

  try {
    // console.warn(">>> esbuilder")
    await esbuilder(null, true)
    // console.warn(">>> DeployRootFileserves")
    await DeployRootFileserves()
    // console.warn(">>> DeployWebrootBuiltIn")
    await DeployWebrootBuiltIn()
    return 0
  } catch (e: any) {
    console.log(ac.bold.red('Unexpected failure updating Webroot deployments'))
    return -1
  }
}
