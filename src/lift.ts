#!/usr/bin/env node

/* eslint @typescript-eslint/no-floating-promises: "off" */

import * as ac from 'ansi-colors'
import * as process from 'process'

import { getLiftVersion } from './lib/LiftVersion'

import { doHelp } from './commands/help'
import { doInit } from './commands/init'
import { doCreate } from './commands/create'
import { doBuildAsync } from './commands/build'
import { doTestAsync } from './commands/test'
import { doPackageAsync } from './commands/package'
import { doDeployAsync } from './commands/deploy'
import { doPublishAsync } from './commands/publish'
import { doUpdateAsync } from './commands/update'
import { doDoctor } from './commands/doctor'
import { startLocalServer } from './commands/start'
import { doSettings } from './commands/settings'
import { doInfo } from './commands/info'

const command = process.argv[2] ?? 'help'
const args = process.argv.slice(3)

async function processCommand (): Promise<void> {
  switch (command) {
    case 'version':
    case '--version':
    case '-v':
      console.log(`Lift v${getLiftVersion().toString()}`)
      return
    case 'help':
      return doHelp(args[0] ?? '')
    case 'doctor':
      await doDoctor()
      return
    case 'init':
      return await doInit(args[0] ?? '')
    case 'create':
      return doCreate(args[0] ?? '')
    case 'build': {
      const ret = await doBuildAsync(args)
      if (ret !== 0) process.exit(-1)
    }
      return
    case 'test': {
      const ret = await doTestAsync(args)
      if (ret !== 0) process.exit(ret)
    }
      return
    case 'start':
      return await startLocalServer()

    case 'package': {
      const ret = await doPackageAsync(args)
      if (ret !== 0) process.exit(ret)
    }
      return
    case 'deploy': {
      const ret = await doDeployAsync(args)
      if (ret !== 0) process.exit(ret)
    }
      return
    case 'publish': {
      const ret = await doPublishAsync()
      process.exit(ret)
    }
      return
    case 'update': {
      const ret = await doUpdateAsync()
      process.exit(ret)
    }
      return
    case 'settings':
      await doSettings()
      return
    case 'info':
      await doInfo()
      return
  }
  return doUnknown(command)
}

function doUnknown (command: string): void {
  console.log(ac.red.bold(`Unrecognized command ${command ?? ''}`))
  console.log(ac.grey.dim('try'))
  console.log(ac.blue.dim('help, init, create, build, test, start, package, deploy, publish, settings'))
  console.log('')
}

processCommand()
