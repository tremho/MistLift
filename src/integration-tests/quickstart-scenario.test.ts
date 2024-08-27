
/* eslint @typescript-eslint/no-floating-promises: "off" */

import Tap from 'tap'
import { TapAssert } from '@tremho/tap-assert'

import fs from 'fs'
import path from 'path'

import { doInit } from '../commands/init'
import { doCreate } from '../commands/create'
import { doBuildAsync } from '../commands/build'
import { doDeployAsync } from '../commands/deploy'
import { doPublishAsync } from '../commands/publish'

import axios from 'axios'

async function test (t: any): Promise<void> {
  const assert = new TapAssert(t)
  const testMessage = `test on ${Date.now()}`
  // start clean
  if (fs.existsSync('QSTest')) {
    fs.rmSync('QSTest', { recursive: true })
  }
  // init
  await doInit('QSTest', true)

  // verify project got made
  assert.isTrue(fs.existsSync('QSTest'), 'created test project')
  // verify we have a functions dir
  assert.isTrue(fs.existsSync(path.join('QSTest', 'functions')), 'functions exist')
  // verify we have a node_modules dir
  assert.isTrue(fs.existsSync(path.join('QSTest', 'node_modules')), 'node_modules exist')
  // verify we have a webroot dir
  assert.isTrue(fs.existsSync(path.join('QSTest', 'webroot')), 'webroot exists')
  // verify we have a package.json
  assert.isTrue(fs.existsSync(path.join('QSTest', 'package.json')), 'package.json exists')
  // verify we have webroot/docs
  assert.isTrue(fs.existsSync(path.join('QSTest', 'webroot', 'docs', 'apidoc.yaml')), 'yaml exists')
  assert.isTrue(fs.existsSync(path.join('QSTest', 'webroot', 'docs', 'swagger-ui-bundle.js')), 'js exists')
  assert.isTrue(fs.existsSync(path.join('QSTest', 'webroot', 'docs', 'swagger-ui-standalone-preset.js')), 'js exists')
  assert.isTrue(fs.existsSync(path.join('QSTest', 'webroot', 'docs', 'swagger-ui.css')), 'css exists')

  // create
  process.chdir('QSTest')
  await doCreate('IntegrationTest')
  assert.isTrue(fs.existsSync(path.join('functions', 'IntegrationTest')), 'function exists')
  assert.isTrue(fs.existsSync(path.join('functions', 'IntegrationTest', 'src', 'definition.json')), 'definition.json exists')
  assert.isTrue(fs.existsSync(path.join('functions', 'IntegrationTest', 'src', 'local.ts')), 'local.ts exists')
  const maints = path.join('functions', 'IntegrationTest', 'src', 'main.ts')
  assert.isTrue(fs.existsSync(maints), 'main.ts exists')
  let content = fs.readFileSync(maints).toString()
  assert.contains(content, 'Hello, World!', 'Content has expected Hello, World! to start with')
  content = content.replace('Hello, World!', testMessage)
  assert.contains(content, testMessage, 'Contents successfully replaced with test message')
  fs.writeFileSync(maints, content)

  // build
  await doBuildAsync(['--clean'])

  await doDeployAsync([])

  await doPublishAsync()

  const publishedJson = fs.readFileSync('.published').toString()
  const publishedInfo = JSON.parse(publishedJson)
  const apiUrl: string = publishedInfo.url
  assert.isTrue(apiUrl.length > 0, 'url exists')
  const testUrl = apiUrl + '/integrationtest'

  const resp: any = await axios.get(testUrl)
  assert.isEqual(resp.status, 200, 'status is 200')
  const data: string = resp.data.toString()
  assert.isEqual(data, testMessage, 'saw expected data')

  // clean up
  process.chdir('..')
  fs.rmSync('QSTest', { recursive: true })

  t.end()
}

Tap.test('Integration Quickstart', async t => {
  await test(t)
})
