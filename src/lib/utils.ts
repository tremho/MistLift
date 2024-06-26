/* eslint @typescript-eslint/no-var-requires: "off" */
import { executeCommand } from './executeCommand'
import * as ac from 'ansi-colors'
import * as fs from 'fs'

/** General utilities */

const zipDir = require('zip-dir')

// pause the given number of milliseconds
export async function delay (
  ms: number // milliseconds to delay
): Promise<void> {
  return await new Promise(resolve => { setTimeout(resolve, ms) })
}

export async function FolderToZip (
  folderPath: string,
  zipPath: string
): Promise<Uint8Array> {
  return new Promise(resolve => {
    zipDir(folderPath, { saveTo: zipPath }, function (err: any, buffer: Uint8Array) {
      if (err !== '' && err !== undefined && err !== null) throw err
      // `buffer` is the buffer of the zipped file
      // And the buffer was saved to `~/myzip.zip`
      resolve(buffer)
    })
  })
}
export async function UnzipToFolder (
  zipPath: string,
  folderPath: string,
  replace: boolean = true
): Promise<void> {
  // TODO: using CLI -- find a good package. "unzip" has vulnerabilities. Try others.

  if (replace) fs.rmSync(folderPath, { recursive: true, force: true })
  const result: { retcode: number, errStr: string } = await executeCommand('unzip', [zipPath, '-d', folderPath])
  if (result.retcode !== 0) {
    console.error(ac.red.bold(`failed to stage webroot (${result.retcode}): ${result.errStr}`))
    throw Error()
  }
}
