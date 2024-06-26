
/* eslint @typescript-eslint/no-floating-promises: "off" */

import Tap from 'tap'

import * as path from 'path'
import { isNewerFile } from '../fileCompare'

function test (t: any): void {
// ./dir1/file.1 551 < ./dir2/file.1 552
  // ./dir1/file.2 553 > ./dir2/file.1 552
  // ./dir1  553 > ./dir2 552
  // .dir1 (.1) 552 < ./dir2 552

  const dir1 = path.join(__dirname, 'dir1')
  const dir2 = path.join(__dirname, 'dir2')
  const dir1File1 = path.join(dir1, 'file.1')
  const dir1File2 = path.join(dir1, 'file.2')
  const dir2File1 = path.join(dir2, 'file.1')

  let newer = isNewerFile(dir1File1, dir2File1)
  t.equal(newer, false, './dir1/file.1 < ./dir2/file.1')
  newer = isNewerFile(dir1File2, dir2File1)
  t.equal(newer, true, './dir1/file.2 > ./dir2/file.1')
  newer = isNewerFile(dir1, dir2)
  t.ok(newer, 'dir1 > dir2')
  newer = isNewerFile(dir1, dir2, '.1')
  t.ok(!newer, './dir1 (.1) < ./dir2')

  t.end()
}

Tap.test('IsNewer', t => {
  test(t)
})
