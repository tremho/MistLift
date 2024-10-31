import { executeCommand } from '../lib/executeCommand'
import { doBuildAsync } from './build'
import { isTapInstalled } from './doctor'
import * as ac from 'ansi-colors'

export async function doTestAsync (args: string[]): Promise<number> {
  if (await doBuildAsync(args) !== 0) return 1 // don't test if build fails

  if (!await isTapInstalled()) {
    // don't continue if tap unavaiable
    console.log(ac.yellow.dim.bold.italic('\nTap is necessary for the lift test command.\nInstall with ') + ac.black.bold('npm i -g tap\n'))
    return 1
  }

  if (args.length === 0) args = ['*']
  let ret = 0
  for (const funcName of args) {
    const result = await executeCommand('tap', [
            `build/functions/${funcName}/*.test.js`,
            /*
                             - base -- looks a lot like terse
                             - terse -- pass/fail counts
                             - min -- errors only
                             - dot -- like min, but a dot per assert
                             - silent
                             - json
                             - jsonstream
                             - markdown
                             - junit
                             - tap
             */
            '--reporter=base',
            '--color',
            '--passes',
            '--allow-empty-coverage',
            '--allow-incomplete-coverage'

    ], '', true)

    if (result.retcode !== 0) {
      ret = result.retcode
      break
    }
  }
  return ret
}
