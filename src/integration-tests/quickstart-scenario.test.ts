
/* eslint @typescript-eslint/no-floating-promises: "off" */

import Tap from 'tap'

import fs from 'fs'
import path from 'path'

import { doInit } from '../commands/init'
import { doCreate } from '../commands/create'
import { doBuildAsync } from '../commands/build'
import { doDeployAsync } from '../commands/deploy'
import { doPublishAsync } from '../commands/publish'

import axios from 'axios'

async function test (t: any): Promise<void> {
  const testMessage = `test on ${Date.now()}`
  // start clean
  fs.rmSync('./QSTest', { recursive: true })
  // init
  await doInit('QSTest', true)

  // verify project got made
  t.ok(fs.existsSync('./QSTest'), 'created test project', '')
  // verify we have a functions dir
  t.ok(fs.existsSync(path.join('./QSTest', 'functions')), '')
  // verify we have a node_modules dir
  t.ok(fs.existsSync(path.join('./QSTest', 'node_modules')), '')
  // verify we have a webroot dir
  t.ok(fs.existsSync(path.join('./QSTest', 'webroot')), '')
  // verify we have a package.json
  t.ok(fs.existsSync(path.join('./QSTest', 'package.json')), '')
  // verify we have webroot/docs
  t.ok(fs.existsSync(path.join('./QSTest', 'webroot', 'docs', 'apidoc.yaml')), '')
  t.ok(fs.existsSync(path.join('./QSTest', 'webroot', 'docs', 'swagger-ui-bundle.js')), '')
  t.ok(fs.existsSync(path.join('./QSTest', 'webroot', 'docs', 'swagger-ui-standalone-preset.js')), '')
  t.ok(fs.existsSync(path.join('./QSTest', 'webroot', 'docs', 'swagger-ui.css')), '')

  // create
  process.chdir('./QSTest')
  await doCreate('IntegrationTest')
  t.ok(fs.existsSync(path.join('functions', 'IntegrationTest')), '')
  t.ok(fs.existsSync(path.join('functions', 'IntegrationTest', 'src', 'definition.json')), '')
  t.ok(fs.existsSync(path.join('functions', 'IntegrationTest', 'src', 'local.ts')), '')
  const maints = path.join('functions', 'IntegrationTest', 'src', 'main.ts', '')
  t.ok(fs.existsSync(maints))
  const content = fs.readFileSync(maints).toString().replace('Hello,  World!', testMessage)
  fs.writeFileSync(maints, content)

  // build
  await doBuildAsync(['--clean'])

  await doDeployAsync([])

  await doPublishAsync()

  const publishedJson = fs.readFileSync('.published').toString()
  const publishedInfo = JSON.parse(publishedJson)
  const apiUrl: string = publishedInfo.url
  t.ok(apiUrl.length > 0)
  const testUrl = apiUrl + '/integrationtest'

  const resp: any = await axios.get(testUrl)
  t.ok(resp.status === 200)
  const data: string = resp.data.toString()
  t.ok(data === testMessage, 'data expected to be ' + testMessage + ' but it was ' + data)

  t.end()
}

Tap.test('Integration Quickstart', async t => {
  await test(t)
})
