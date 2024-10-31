
// import * as path from 'path'
import { deployPackage } from '../deploy'
// import sha1 from 'sha1'
// import * as ac from 'ansi-colors'

export async function DeployBuiltInZip
(
  name: string,
  zipPath: string
): Promise<void> {
  // console.log(ac.gray.dim('>> DeployBuiltInZip '))
  await deployPackage(name, zipPath)
  // console.log(ac.gray.dim('>> returning from DeployBuiltInZip '))
}
